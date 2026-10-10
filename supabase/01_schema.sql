-- =====================================================================
-- Product A prototype (LAB-2) — 桜水産市場 業務支援システム
-- 01_schema.sql : bảng, ràng buộc, RLS, hàm nghiệp vụ
-- Chạy file này TRƯỚC 02_seed.sql trong Supabase SQL Editor.
-- Toàn bộ dữ liệu là hư cấu (mock), không dùng dữ liệu nghiệp vụ thật.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tiện ích
-- ---------------------------------------------------------------------
create or replace function jst_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Tokyo')::date $$;

-- ---------------------------------------------------------------------
-- Người dùng nội bộ & vai trò (TBL-ROLE-01)
-- ---------------------------------------------------------------------
create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  roles text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_valid check (roles <@ array['SYS_ADMIN','INTAKE','JUDGE','TRADE','DELIVERY','SETTLEMENT','RULE_ADMIN']::text[])
);

-- ---------------------------------------------------------------------
-- Audit log (FR-AUDIT-01..03)
-- ---------------------------------------------------------------------
create table if not exists audit_logs (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  reason text,
  result text not null default 'OK' check (result in ('OK','BLOCKED'))
);
create index if not exists audit_logs_entity_idx on audit_logs(entity, entity_id);
create index if not exists audit_logs_at_idx on audit_logs(at desc);

create or replace function write_audit(p_actor uuid, p_action text, p_entity text, p_entity_id text,
  p_before jsonb default null, p_after jsonb default null, p_reason text default null, p_result text default 'OK')
returns void language plpgsql as $$
begin
  insert into audit_logs(actor_id, actor_name, action, entity, entity_id, before, after, reason, result)
  values (p_actor, (select display_name from app_users where id = p_actor), p_action, p_entity, p_entity_id,
          p_before, p_after, p_reason, p_result);
end $$;

-- ---------------------------------------------------------------------
-- Danh mục dùng chung, lịch nghỉ, ngày nghiệp vụ
-- ---------------------------------------------------------------------
create table if not exists master_items (
  id serial primary key,
  category text not null check (category in ('ITEM','UNIT','GRADE','DELIVERY_EXCEPTION','DISPUTE_CAUSE')),
  code text not null,
  name_ja text not null,
  name_vi text not null,
  sort int not null default 0,
  active boolean not null default true,
  unique (category, code)
);

create table if not exists holidays (
  holiday date primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists business_days (
  biz_date date primary key,
  status text not null default 'OPEN' check (status in ('OPEN','LOCKED')),
  locked_by uuid references app_users(id),
  locked_at timestamptz,
  note text
);

create or replace function is_day_locked(p_date date) returns boolean
language sql stable as $$
  select coalesce((select status = 'LOCKED' from business_days where biz_date = p_date), false)
$$;

-- ---------------------------------------------------------------------
-- Người tham gia & tư cách tham gia (FR-PARTY-01..03, FIG-004)
-- 許可 (PERMIT) và 承認 (APPROVAL) là hai loại khác nhau, không gộp.
-- ---------------------------------------------------------------------
create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('WHOLESALER','INTERMEDIARY','APPROVED_BUYER','MARKET_BUYER')),
  name text not null,
  name_kana text,
  phone text,
  email text,
  address text,
  participation_limit numeric(14,0),          -- 参加上限: chỉ lưu & hiển thị (giả định Q-12)
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','INACTIVE')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function required_qual_type(p_kind text) returns text
language sql immutable as $$
  select case p_kind
    when 'WHOLESALER' then 'REGISTRATION'   -- 市場登録
    when 'INTERMEDIARY' then 'PERMIT'       -- 許可
    when 'APPROVED_BUYER' then 'APPROVAL'   -- 承認
    when 'MARKET_BUYER' then 'REGISTRATION' -- 買出人登録
  end
$$;

create table if not exists qualifications (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties(id) on delete cascade,
  qual_type text not null check (qual_type in ('REGISTRATION','PERMIT','APPROVAL')),
  qual_no text not null,
  valid_from date not null,
  valid_to date not null,
  status text not null default 'VALID' check (status in ('VALID','SUSPENDED','REVOKED')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_range check (valid_to >= valid_from)
);
create index if not exists qualifications_party_idx on qualifications(party_id);

-- Loại tư cách phải đúng với loại người tham gia (仲卸=許可, 売買参加者=承認)
create or replace function trg_qual_type_check() returns trigger language plpgsql as $$
declare v_kind text;
begin
  select kind into v_kind from parties where id = new.party_id;
  if required_qual_type(v_kind) <> new.qual_type then
    raise exception 'QUAL_TYPE_MISMATCH: % requires %', v_kind, required_qual_type(v_kind);
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists qual_type_check on qualifications;
create trigger qual_type_check before insert or update on qualifications
for each row execute function trg_qual_type_check();

-- Trả về NULL nếu hợp lệ, ngược lại trả mã lý do (BR-PERM-01)
create or replace function party_block_reason(p_party uuid, p_date date) returns text
language plpgsql stable as $$
declare v_p parties; v_ok boolean;
begin
  select * into v_p from parties where id = p_party;
  if not found then return 'PARTY_NOT_FOUND'; end if;
  if v_p.status <> 'ACTIVE' then return 'PARTY_' || v_p.status; end if;
  select exists(
    select 1 from qualifications q
    where q.party_id = p_party and q.qual_type = required_qual_type(v_p.kind)
      and q.status = 'VALID' and p_date between q.valid_from and q.valid_to
  ) into v_ok;
  if not v_ok then return 'NO_VALID_' || required_qual_type(v_p.kind); end if;
  return null;
end $$;

-- ---------------------------------------------------------------------
-- Lot & kết quả đánh giá (FR-LOT-01..04)
-- ---------------------------------------------------------------------
create sequence if not exists lot_seq;
create table if not exists lots (
  id uuid primary key default gen_random_uuid(),
  lot_no text not null unique,
  temp_no text,
  biz_date date not null,
  wholesaler_id uuid not null references parties(id),
  item_code text not null,
  origin text,
  vessel text,
  unit text not null default 'KG',
  quantity_initial numeric(12,1) not null check (quantity_initial > 0),
  quantity_available numeric(12,1) not null check (quantity_available >= 0),  -- BR-LOT-02: không âm
  status text not null default 'RECEIVED' check (status in ('RECEIVED','INSPECTED','ON_SALE','SOLD_OUT')),
  note text,
  received_by uuid references app_users(id),
  created_at timestamptz not null default now()
);
create index if not exists lots_biz_date_idx on lots(biz_date);

create table if not exists lot_evaluations (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  grade text not null,
  freshness text,
  note text,
  evaluator_name text not null,          -- người thẩm định (con người phán đoán)
  recorded_by uuid references app_users(id),
  recorded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Giao dịch 相対 / せり (FR-AITAI, FR-SERI)
-- Giá trị gốc không bao giờ bị sửa; điều chỉnh = bản ghi delta.
-- ---------------------------------------------------------------------
create sequence if not exists trade_seq;
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  trade_no text not null unique,
  trade_type text not null check (trade_type in ('AITAI','SERI')),
  biz_date date not null,
  lot_id uuid not null references lots(id),
  seller_id uuid not null references parties(id),
  buyer_id uuid not null references parties(id),
  quantity numeric(12,1) not null check (quantity > 0),
  unit_price numeric(12,0) not null check (unit_price >= 0),
  amount numeric(14,0) not null,
  seri_board_no text,                     -- 場内番号 (chỉ せり)
  seri_confirmer text,                    -- người xác nhận kết quả せり tại chỗ
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED','CANCELLED')),
  delivery_status text not null default 'PENDING' check (delivery_status in ('PENDING','PARTIAL','COMPLETED','EXCEPTION')),
  delivered_qty numeric(12,1) not null default 0,
  confirmed_by uuid references app_users(id),
  confirmed_at timestamptz not null default now(),
  cancel_reason text,
  cancelled_by uuid references app_users(id),
  cancelled_at timestamptz,
  note text
);
create index if not exists trades_biz_date_idx on trades(biz_date);
create index if not exists trades_lot_idx on trades(lot_id);
create index if not exists trades_buyer_idx on trades(buyer_id);

create table if not exists correction_requests (
  id uuid primary key default gen_random_uuid(),
  req_no text not null unique,
  trade_id uuid not null references trades(id),
  requested_by uuid not null references app_users(id),
  requested_at timestamptz not null default now(),
  reason text not null,
  evidence_note text,
  new_quantity numeric(12,1) not null check (new_quantity > 0),
  new_unit_price numeric(12,0) not null check (new_unit_price >= 0),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  reviewed_by uuid references app_users(id),
  reviewed_at timestamptz,
  review_comment text
);

create table if not exists trade_adjustments (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id),
  correction_id uuid references correction_requests(id),
  delta_quantity numeric(12,1) not null,
  delta_amount numeric(14,0) not null,
  new_unit_price numeric(12,0) not null,
  applied_biz_date date not null,         -- ngày nghiệp vụ ghi nhận delta (ngày mở hiện tại nếu ngày gốc đã khóa)
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

-- Giá trị hiệu lực = gốc + tổng delta
create or replace view trades_effective with (security_invoker = true) as
select t.*,
  t.quantity + coalesce((select sum(a.delta_quantity) from trade_adjustments a where a.trade_id = t.id), 0) as eff_quantity,
  t.amount + coalesce((select sum(a.delta_amount) from trade_adjustments a where a.trade_id = t.id), 0) as eff_amount,
  coalesce((select a.new_unit_price from trade_adjustments a where a.trade_id = t.id order by a.created_at desc limit 1), t.unit_price) as eff_unit_price,
  (select count(*) from trade_adjustments a where a.trade_id = t.id) as adjustment_count
from trades t;

-- ---------------------------------------------------------------------
-- Giao hàng (FR-DEL-01..05)
-- ---------------------------------------------------------------------
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id),
  seq int not null,
  quantity numeric(12,1) not null check (quantity >= 0),
  exception_type text check (exception_type in ('SHORT','OVER','RETURN','PARTIAL_CANCEL')),
  exception_note text,
  delivered_at timestamptz not null default now(),
  biz_date date not null,
  recorded_by uuid references app_users(id),
  unique (trade_id, seq)
);

-- ---------------------------------------------------------------------
-- Tranh chấp (FR-SETTLE-03)
-- ---------------------------------------------------------------------
create sequence if not exists dispute_seq;
create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_no text not null unique,
  biz_date date not null,
  trade_id uuid references trades(id),
  cause_code text not null,
  description text not null,
  assignee text,
  due_date date,
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','RESOLVED')),
  resolution text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists dispute_updates (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references disputes(id) on delete cascade,
  status text not null,
  note text not null,
  updated_by uuid references app_users(id),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Version tỷ lệ thưởng (GOV-RULE-01, FR-INC-02, FR-RULE-01)
-- ---------------------------------------------------------------------
create table if not exists rate_versions (
  id uuid primary key default gen_random_uuid(),
  version_no int not null unique,
  effective_from date not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED','REJECTED')),
  note text,
  rollback_of uuid references rate_versions(id),
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  approved_by uuid references app_users(id),
  approved_at timestamptz,
  review_comment text
);
create table if not exists rate_tiers (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references rate_versions(id) on delete cascade,
  min_amount numeric(14,0) not null check (min_amount >= 0),
  rate numeric(6,4) not null check (rate >= 0 and rate < 1),
  unique (version_id, min_amount)
);

-- ---------------------------------------------------------------------
-- Thanh toán (MOCK – dữ liệu đổ sẵn, không có module thanh toán) & tiền thưởng
-- ---------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties(id),
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  billed_amount numeric(14,0) not null,
  due_date date not null,
  paid_amount numeric(14,0) not null default 0,
  paid_date date,
  unique (party_id, period)
);

create table if not exists incentive_runs (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  rate_version_id uuid references rate_versions(id),
  run_by uuid references app_users(id),
  run_at timestamptz not null default now(),
  is_latest boolean not null default true,
  total_incentive numeric(14,0) not null default 0
);
create table if not exists incentive_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references incentive_runs(id) on delete cascade,
  party_id uuid not null references parties(id),
  billed_amount numeric(14,0) not null,
  paid_amount numeric(14,0) not null,
  due_date date not null,
  paid_date date,
  on_time boolean not null,
  eligible_amount numeric(14,0) not null,
  rate numeric(6,4) not null,
  incentive_amount numeric(14,0) not null,
  reason text
);

-- ---------------------------------------------------------------------
-- Thông báo (FR-NOTIFY-01..03) – email là MOCK
-- ---------------------------------------------------------------------
create table if not exists notification_settings (
  event_type text primary key check (event_type in ('QUAL_EXPIRING','DISPUTE_OVERDUE','DELIVERY_BACKLOG','EXPORT_FAILED')),
  enabled boolean not null default true,
  severity text not null default 'INFO' check (severity in ('INFO','CRITICAL')),
  recipient_roles text[] not null default '{}',
  threshold_days int not null default 0,
  email_enabled boolean not null default true,
  updated_by uuid references app_users(id),
  updated_at timestamptz not null default now()
);
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'INFO',
  channel text not null check (channel in ('IN_APP','EMAIL')),
  target_role text,
  recipient text,
  title_ja text not null,
  title_vi text not null,
  body text,
  status text not null default 'SENT' check (status in ('SENT','FAILED')),
  attempts int not null default 1,
  ops_alert boolean not null default false,
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Hàm nghiệp vụ (gọi từ Next.js API route qua supabase.rpc với service role)
-- Mọi lỗi nghiệp vụ raise exception dạng 'CODE: chi tiết' để API dịch ra VI/JA.
-- Lưu ý: audit cho thao tác BỊ CHẶN không ghi trong hàm (exception sẽ rollback cả bản ghi audit);
-- API route ghi audit result='BLOCKED' bằng một lệnh riêng sau khi nhận lỗi.
-- =====================================================================

-- Tạo lot (FR-LOT-01)
create or replace function create_lot(p_user uuid, p_biz_date date, p_wholesaler uuid, p_item text,
  p_qty numeric, p_unit text, p_origin text, p_vessel text, p_temp_no text, p_note text)
returns lots language plpgsql as $$
declare v lots; v_reason text;
begin
  if is_day_locked(p_biz_date) then
    raise exception 'DAY_LOCKED: %', p_biz_date;
  end if;
  if (select kind from parties where id = p_wholesaler) is distinct from 'WHOLESALER' then
    raise exception 'NOT_WHOLESALER';
  end if;
  v_reason := party_block_reason(p_wholesaler, p_biz_date);
  if v_reason is not null then raise exception 'PARTY_BLOCKED: %', v_reason; end if;
  insert into lots(lot_no, temp_no, biz_date, wholesaler_id, item_code, origin, vessel, unit,
                   quantity_initial, quantity_available, received_by, note)
  values ('L' || to_char(p_biz_date, 'YYMMDD') || '-' || lpad(nextval('lot_seq')::text, 4, '0'),
          p_temp_no, p_biz_date, p_wholesaler, p_item, p_origin, p_vessel, coalesce(p_unit, 'KG'),
          p_qty, p_qty, p_user, p_note)
  returning * into v;
  perform write_audit(p_user, 'LOT_CREATE', 'lots', v.id::text, null, to_jsonb(v));
  return v;
end $$;

-- Ghi kết quả đánh giá do con người thực hiện (FR-LOT-02)
create or replace function record_evaluation(p_user uuid, p_lot uuid, p_grade text, p_freshness text,
  p_evaluator text, p_note text)
returns lot_evaluations language plpgsql as $$
declare v lot_evaluations; v_lot lots;
begin
  select * into v_lot from lots where id = p_lot for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into lot_evaluations(lot_id, grade, freshness, note, evaluator_name, recorded_by)
  values (p_lot, p_grade, p_freshness, p_note, p_evaluator, p_user) returning * into v;
  if v_lot.status = 'RECEIVED' then update lots set status = 'INSPECTED' where id = p_lot; end if;
  perform write_audit(p_user, 'LOT_EVALUATE', 'lots', p_lot::text,
    case when v_lot.status <> 'RECEIVED' then jsonb_build_object('status', v_lot.status) end,
    to_jsonb(v), case when v_lot.status <> 'RECEIVED' then 'update after inspection' end);
  return v;
end $$;

-- Công khai lot để giao dịch
create or replace function publish_lot(p_user uuid, p_lot uuid) returns lots language plpgsql as $$
declare v lots;
begin
  select * into v from lots where id = p_lot for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v.status <> 'INSPECTED' then raise exception 'LOT_NOT_INSPECTED'; end if;
  update lots set status = 'ON_SALE' where id = p_lot returning * into v;
  perform write_audit(p_user, 'LOT_PUBLISH', 'lots', p_lot::text, jsonb_build_object('status','INSPECTED'), jsonb_build_object('status','ON_SALE'));
  return v;
end $$;

-- Chốt giao dịch 相対 hoặc ghi kết quả せり cuối (FR-AITAI-01/02, FR-SERI-01/02, FR-LOT-03)
create or replace function confirm_trade(p_user uuid, p_type text, p_biz_date date, p_lot uuid, p_buyer uuid,
  p_qty numeric, p_unit_price numeric, p_board_no text, p_confirmer text, p_note text)
returns trades language plpgsql as $$
declare v_lot lots; v trades; v_reason text;
begin
  if p_type not in ('AITAI','SERI') then raise exception 'BAD_TYPE'; end if;
  if is_day_locked(p_biz_date) then
    raise exception 'DAY_LOCKED: %', p_biz_date;
  end if;
  select * into v_lot from lots where id = p_lot for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_lot.status not in ('ON_SALE') then raise exception 'LOT_NOT_ON_SALE: %', v_lot.status; end if;
  if (select kind from parties where id = p_buyer) not in ('INTERMEDIARY','APPROVED_BUYER','MARKET_BUYER') then
    raise exception 'BUYER_KIND_INVALID';
  end if;
  -- Kiểm tra 許可/承認/登録 tại thời điểm chốt (BR-PERM-01)
  v_reason := party_block_reason(p_buyer, p_biz_date);
  if v_reason is not null then
    raise exception 'PARTY_BLOCKED: %', v_reason;
  end if;
  v_reason := party_block_reason(v_lot.wholesaler_id, p_biz_date);
  if v_reason is not null then raise exception 'SELLER_BLOCKED: %', v_reason; end if;
  -- Chống bán vượt (BR-LOT-02)
  if p_qty <= 0 then raise exception 'QTY_INVALID'; end if;
  if p_qty > v_lot.quantity_available then
    raise exception 'QTY_EXCEEDS_AVAILABLE: %', v_lot.quantity_available;
  end if;
  if p_type = 'SERI' and coalesce(trim(p_confirmer), '') = '' then raise exception 'SERI_CONFIRMER_REQUIRED'; end if;

  insert into trades(trade_no, trade_type, biz_date, lot_id, seller_id, buyer_id, quantity, unit_price, amount,
                     seri_board_no, seri_confirmer, confirmed_by, note)
  values ((case when p_type = 'AITAI' then 'A' else 'S' end) || to_char(p_biz_date, 'YYMMDD') || '-' ||
            lpad(nextval('trade_seq')::text, 5, '0'),
          p_type, p_biz_date, p_lot, v_lot.wholesaler_id, p_buyer, p_qty, p_unit_price, floor(p_qty * p_unit_price),
          case when p_type = 'SERI' then p_board_no end, case when p_type = 'SERI' then p_confirmer end, p_user, p_note)
  returning * into v;

  update lots set quantity_available = quantity_available - p_qty,
                  status = case when quantity_available - p_qty = 0 then 'SOLD_OUT' else status end
  where id = p_lot;
  perform write_audit(p_user, case when p_type = 'AITAI' then 'TRADE_CONFIRM_AITAI' else 'TRADE_RECORD_SERI' end,
                      'trades', v.id::text, null, to_jsonb(v));
  return v;
end $$;

-- Hủy giao dịch chưa khóa (FR-AITAI-03)
create or replace function cancel_trade(p_user uuid, p_trade uuid, p_reason text) returns trades
language plpgsql as $$
declare v trades; v_new trades;
begin
  select * into v from trades where id = p_trade for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  if is_day_locked(v.biz_date) then
    raise exception 'DAY_LOCKED: %', v.biz_date;
  end if;
  if v.status <> 'CONFIRMED' then raise exception 'TRADE_NOT_CONFIRMED'; end if;
  if v.delivered_qty > 0 then raise exception 'TRADE_HAS_DELIVERY'; end if;
  if exists(select 1 from trade_adjustments where trade_id = p_trade) then raise exception 'TRADE_HAS_ADJUSTMENT'; end if;
  update trades set status = 'CANCELLED', cancel_reason = p_reason, cancelled_by = p_user, cancelled_at = now()
  where id = p_trade returning * into v_new;
  update lots set quantity_available = quantity_available + v.quantity,
                  status = case when status = 'SOLD_OUT' then 'ON_SALE' else status end
  where id = v.lot_id;
  perform write_audit(p_user, 'TRADE_CANCEL', 'trades', p_trade::text,
    jsonb_build_object('status', v.status), jsonb_build_object('status', 'CANCELLED'), p_reason);
  return v_new;
end $$;

-- Ghi giao hàng (nhiều lần) & ngoại lệ (FR-DEL-01..05, BR-DEL-03)
create or replace function record_delivery(p_user uuid, p_trade uuid, p_qty numeric, p_exception text, p_note text)
returns deliveries language plpgsql as $$
declare v_t trades_effective; v deliveries; v_cum numeric; v_status text;
begin
  perform 1 from trades where id = p_trade for update;
  select * into v_t from trades_effective where id = p_trade;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_t.status <> 'CONFIRMED' then raise exception 'TRADE_NOT_CONFIRMED'; end if;
  if v_t.delivery_status = 'COMPLETED' then raise exception 'DELIVERY_ALREADY_COMPLETED'; end if;
  if p_qty < 0 then raise exception 'QTY_INVALID'; end if;
  if p_exception is not null and coalesce(trim(p_note), '') = '' then raise exception 'EXCEPTION_NOTE_REQUIRED'; end if;
  if p_qty = 0 and p_exception is null then raise exception 'QTY_INVALID'; end if;
  v_cum := v_t.delivered_qty + p_qty;
  if v_cum > v_t.eff_quantity and coalesce(p_exception, '') <> 'OVER' then
    raise exception 'OVER_DELIVERY: %', v_t.eff_quantity - v_t.delivered_qty;
  end if;
  v_status := case
    when p_exception is not null then 'EXCEPTION'
    when v_cum = v_t.eff_quantity then 'COMPLETED'
    else 'PARTIAL' end;
  insert into deliveries(trade_id, seq, quantity, exception_type, exception_note, biz_date, recorded_by)
  values (p_trade, coalesce((select max(seq) from deliveries where trade_id = p_trade), 0) + 1,
          p_qty, p_exception, p_note, jst_today(), p_user)
  returning * into v;
  update trades set delivered_qty = v_cum, delivery_status = v_status where id = p_trade;
  perform write_audit(p_user, 'DELIVERY_RECORD', 'trades', p_trade::text,
    jsonb_build_object('delivered_qty', v_t.delivered_qty, 'delivery_status', v_t.delivery_status),
    jsonb_build_object('delivered_qty', v_cum, 'delivery_status', v_status, 'exception', p_exception), p_note);
  return v;
end $$;

-- Xác nhận đóng ngoại lệ giao hàng (người xác nhận ngoại lệ)
create or replace function close_delivery_exception(p_user uuid, p_trade uuid, p_note text) returns trades
language plpgsql as $$
declare v trades;
begin
  select * into v from trades where id = p_trade for update;
  if v.delivery_status <> 'EXCEPTION' then raise exception 'NOT_EXCEPTION'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  update trades set delivery_status = 'COMPLETED' where id = p_trade returning * into v;
  perform write_audit(p_user, 'DELIVERY_EXCEPTION_CLOSE', 'trades', p_trade::text,
    jsonb_build_object('delivery_status','EXCEPTION'), jsonb_build_object('delivery_status','COMPLETED'), p_note);
  return v;
end $$;

-- Tổng hợp đối soát ngày (FR-SETTLE-01)
create or replace function settlement_summary(p_date date) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'biz_date', p_date,
    'status', coalesce((select status from business_days where biz_date = p_date), 'OPEN'),
    'locked_at', (select locked_at from business_days where biz_date = p_date),
    'locked_by', (select u.display_name from business_days b join app_users u on u.id = b.locked_by where b.biz_date = p_date),
    'aitai_count', (select count(*) from trades where biz_date = p_date and status = 'CONFIRMED' and trade_type = 'AITAI'),
    'seri_count', (select count(*) from trades where biz_date = p_date and status = 'CONFIRMED' and trade_type = 'SERI'),
    'cancelled_count', (select count(*) from trades where biz_date = p_date and status = 'CANCELLED'),
    'aitai_amount', (select coalesce(sum(eff_amount),0) from trades_effective where biz_date = p_date and status = 'CONFIRMED' and trade_type = 'AITAI'),
    'seri_amount', (select coalesce(sum(eff_amount),0) from trades_effective where biz_date = p_date and status = 'CONFIRMED' and trade_type = 'SERI'),
    'delivery_pending', (select count(*) from trades where biz_date = p_date and status = 'CONFIRMED' and delivery_status in ('PENDING','PARTIAL')),
    'delivery_exception', (select count(*) from trades where biz_date = p_date and status = 'CONFIRMED' and delivery_status = 'EXCEPTION'),
    'open_disputes', (select count(*) from disputes where biz_date = p_date and status <> 'RESOLVED'),
    'adjustments_in_day', (select count(*) from trade_adjustments where applied_biz_date = p_date),
    'lots', (select count(*) from lots where biz_date = p_date)
  )
$$;

-- Khóa ngày nghiệp vụ (FR-SETTLE-02). Không có chức năng mở khóa (giả định Q-07).
create or replace function lock_business_day(p_user uuid, p_date date, p_note text) returns business_days
language plpgsql as $$
declare v business_days;
begin
  if p_date > jst_today() then raise exception 'FUTURE_DATE'; end if;
  if is_day_locked(p_date) then raise exception 'DAY_ALREADY_LOCKED'; end if;
  insert into business_days(biz_date, status, locked_by, locked_at, note)
  values (p_date, 'LOCKED', p_user, now(), p_note)
  on conflict (biz_date) do update set status = 'LOCKED', locked_by = p_user, locked_at = now(), note = p_note
  returning * into v;
  perform write_audit(p_user, 'DAY_LOCK', 'business_days', p_date::text, jsonb_build_object('status','OPEN'),
    settlement_summary(p_date), p_note);
  return v;
end $$;

-- Yêu cầu sửa giao dịch đã chốt (FR-CORR-01)
create sequence if not exists corr_seq;
create or replace function request_correction(p_user uuid, p_trade uuid, p_new_qty numeric, p_new_price numeric,
  p_reason text, p_evidence text) returns correction_requests language plpgsql as $$
declare v correction_requests; v_t trades_effective;
begin
  select * into v_t from trades_effective where id = p_trade;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_t.status <> 'CONFIRMED' then raise exception 'TRADE_NOT_CONFIRMED'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  if p_new_qty = v_t.eff_quantity and p_new_price = v_t.eff_unit_price then raise exception 'NO_CHANGE'; end if;
  if exists(select 1 from correction_requests where trade_id = p_trade and status = 'PENDING') then
    raise exception 'PENDING_CORRECTION_EXISTS';
  end if;
  insert into correction_requests(req_no, trade_id, requested_by, reason, evidence_note, new_quantity, new_unit_price)
  values ('C' || to_char(jst_today(), 'YYMMDD') || '-' || lpad(nextval('corr_seq')::text, 4, '0'),
          p_trade, p_user, p_reason, p_evidence, p_new_qty, p_new_price)
  returning * into v;
  perform write_audit(p_user, 'CORRECTION_REQUEST', 'trades', p_trade::text,
    jsonb_build_object('quantity', v_t.eff_quantity, 'unit_price', v_t.eff_unit_price),
    jsonb_build_object('quantity', p_new_qty, 'unit_price', p_new_price, 'req_no', v.req_no), p_reason);
  return v;
end $$;

-- Duyệt / bác yêu cầu sửa: sinh bản ghi delta, không ghi đè (FR-CORR-02, BR-CLOSE-01)
create or replace function review_correction(p_user uuid, p_req uuid, p_approve boolean, p_comment text)
returns correction_requests language plpgsql as $$
declare v correction_requests; v_t trades_effective; v_dq numeric; v_new_amount numeric; v_applied date;
begin
  select * into v from correction_requests where id = p_req for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v.status <> 'PENDING' then raise exception 'ALREADY_REVIEWED'; end if;
  if v.requested_by = p_user then
    raise exception 'SAME_PERSON';
  end if;
  if not p_approve then
    if coalesce(trim(p_comment), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    update correction_requests set status = 'REJECTED', reviewed_by = p_user, reviewed_at = now(), review_comment = p_comment
    where id = p_req returning * into v;
    perform write_audit(p_user, 'CORRECTION_REJECT', 'trades', v.trade_id::text, null, jsonb_build_object('req_no', v.req_no), p_comment);
    return v;
  end if;
  perform 1 from trades where id = v.trade_id for update;
  select * into v_t from trades_effective where id = v.trade_id;
  v_dq := v.new_quantity - v_t.eff_quantity;
  v_new_amount := floor(v.new_quantity * v.new_unit_price);
  if v.new_quantity < v_t.delivered_qty then raise exception 'BELOW_DELIVERED: %', v_t.delivered_qty; end if;
  if v_dq > 0 and (select quantity_available from lots where id = v_t.lot_id) < v_dq then
    raise exception 'QTY_EXCEEDS_AVAILABLE: %', (select quantity_available from lots where id = v_t.lot_id);
  end if;
  -- Ngày gốc đã khóa → delta ghi vào ngày nghiệp vụ hiện tại
  v_applied := case when is_day_locked(v_t.biz_date) then jst_today() else v_t.biz_date end;
  insert into trade_adjustments(trade_id, correction_id, delta_quantity, delta_amount, new_unit_price, applied_biz_date, created_by)
  values (v.trade_id, v.id, v_dq, v_new_amount - v_t.eff_amount, v.new_unit_price, v_applied, p_user);
  update lots set quantity_available = quantity_available - v_dq,
                  status = case when quantity_available - v_dq = 0 then 'SOLD_OUT'
                                when status = 'SOLD_OUT' and quantity_available - v_dq > 0 then 'ON_SALE' else status end
  where id = v_t.lot_id;
  update trades set delivery_status = case
      when delivered_qty = v.new_quantity then 'COMPLETED'
      when delivered_qty > 0 then 'PARTIAL' else 'PENDING' end
  where id = v.trade_id and delivery_status <> 'EXCEPTION';
  update correction_requests set status = 'APPROVED', reviewed_by = p_user, reviewed_at = now(), review_comment = p_comment
  where id = p_req returning * into v;
  perform write_audit(p_user, 'CORRECTION_APPROVE', 'trades', v.trade_id::text,
    jsonb_build_object('quantity', v_t.eff_quantity, 'unit_price', v_t.eff_unit_price, 'amount', v_t.eff_amount),
    jsonb_build_object('quantity', v.new_quantity, 'unit_price', v.new_unit_price, 'amount', v_new_amount,
                       'applied_biz_date', v_applied, 'req_no', v.req_no), p_comment);
  return v;
end $$;

-- Tạo version tỷ lệ (bản nháp) — p_tiers: [{"min_amount":0,"rate":0.005},...]
create or replace function save_rate_version(p_user uuid, p_id uuid, p_effective date, p_note text, p_tiers jsonb,
  p_rollback_of uuid default null) returns rate_versions language plpgsql as $$
declare v rate_versions; t jsonb;
begin
  if p_effective < jst_today() then raise exception 'EFFECTIVE_IN_PAST'; end if;
  if jsonb_array_length(coalesce(p_tiers, '[]'::jsonb)) = 0 then raise exception 'TIERS_REQUIRED'; end if;
  if p_id is null then
    insert into rate_versions(version_no, effective_from, note, created_by, rollback_of)
    values (coalesce((select max(version_no) from rate_versions), 0) + 1, p_effective, p_note, p_user, p_rollback_of)
    returning * into v;
  else
    select * into v from rate_versions where id = p_id for update;
    if v.status <> 'DRAFT' then raise exception 'NOT_DRAFT'; end if;
    update rate_versions set effective_from = p_effective, note = p_note where id = p_id returning * into v;
    delete from rate_tiers where version_id = p_id;
  end if;
  for t in select * from jsonb_array_elements(p_tiers) loop
    insert into rate_tiers(version_id, min_amount, rate) values (v.id, (t->>'min_amount')::numeric, (t->>'rate')::numeric);
  end loop;
  perform write_audit(p_user, case when p_id is null then 'RATE_DRAFT_CREATE' else 'RATE_DRAFT_UPDATE' end,
    'rate_versions', v.id::text, null, jsonb_build_object('version_no', v.version_no, 'effective_from', p_effective, 'tiers', p_tiers));
  return v;
end $$;

-- Duyệt version tỷ lệ: tách người lập–người duyệt, tối đa 4 lần/năm (GOV-RULE-01)
create or replace function review_rate_version(p_user uuid, p_id uuid, p_approve boolean, p_comment text)
returns rate_versions language plpgsql as $$
declare v rate_versions; v_cnt int;
begin
  select * into v from rate_versions where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v.status <> 'DRAFT' then raise exception 'NOT_DRAFT'; end if;
  if v.created_by = p_user then
    raise exception 'SAME_PERSON';
  end if;
  if p_approve then
    if v.effective_from < jst_today() then raise exception 'EFFECTIVE_IN_PAST'; end if;
    select count(*) into v_cnt from rate_versions
    where status = 'APPROVED' and extract(year from effective_from) = extract(year from v.effective_from);
    if v_cnt >= 4 then raise exception 'RATE_LIMIT_4'; end if;
    update rate_versions set status = 'APPROVED', approved_by = p_user, approved_at = now(), review_comment = p_comment
    where id = p_id returning * into v;
  else
    if coalesce(trim(p_comment), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    update rate_versions set status = 'REJECTED', approved_by = p_user, approved_at = now(), review_comment = p_comment
    where id = p_id returning * into v;
  end if;
  perform write_audit(p_user, case when p_approve then 'RATE_APPROVE' else 'RATE_REJECT' end, 'rate_versions', p_id::text,
    jsonb_build_object('status','DRAFT'), jsonb_build_object('status', v.status, 'version_no', v.version_no), p_comment);
  return v;
end $$;

create or replace function effective_rate_version(p_date date) returns uuid language sql stable as $$
  select id from rate_versions where status = 'APPROVED' and effective_from <= p_date
  order by effective_from desc, version_no desc limit 1
$$;

-- Tính 完納奨励金 cho một kỳ (FR-INC-01, BR-INC-01)
-- Giả định (Q-05/Q-06): cơ sở = số tiền trả trong hạn; tỷ lệ bậc thang theo cơ sở;
-- thưởng = floor(cơ sở × tỷ lệ × 110/100); trả trễ (paid_date > due_date) hoặc chưa trả → 0; không ân hạn.
create or replace function run_incentive(p_user uuid, p_period text) returns incentive_runs
language plpgsql as $$
declare v_run incentive_runs; v_ver uuid; v_end date; r payments; v_on_time boolean; v_elig numeric; v_rate numeric; v_amt numeric;
begin
  if p_period !~ '^\d{4}-\d{2}$' then raise exception 'BAD_PERIOD'; end if;
  v_end := (to_date(p_period || '-01', 'YYYY-MM-DD') + interval '1 month - 1 day')::date;
  v_ver := effective_rate_version(v_end);
  if v_ver is null then raise exception 'NO_RATE_VERSION'; end if;
  if not exists(select 1 from payments where period = p_period) then raise exception 'NO_PAYMENTS'; end if;
  update incentive_runs set is_latest = false where period = p_period;
  insert into incentive_runs(period, rate_version_id, run_by) values (p_period, v_ver, p_user) returning * into v_run;
  for r in select * from payments where period = p_period loop
    v_on_time := r.paid_date is not null and r.paid_date <= r.due_date;
    v_elig := case when v_on_time then r.paid_amount else 0 end;
    select coalesce((select rate from rate_tiers where version_id = v_ver and min_amount <= v_elig
                     order by min_amount desc limit 1), 0) into v_rate;
    v_amt := floor(v_elig * v_rate * 110 / 100);
    insert into incentive_results(run_id, party_id, billed_amount, paid_amount, due_date, paid_date, on_time,
                                  eligible_amount, rate, incentive_amount, reason)
    values (v_run.id, r.party_id, r.billed_amount, r.paid_amount, r.due_date, r.paid_date, v_on_time, v_elig, v_rate, v_amt,
            case when r.paid_date is null then 'UNPAID' when not v_on_time then 'LATE' else 'ON_TIME' end);
  end loop;
  update incentive_runs set total_incentive = (select coalesce(sum(incentive_amount),0) from incentive_results where run_id = v_run.id)
  where id = v_run.id returning * into v_run;
  perform write_audit(p_user, 'INCENTIVE_RUN', 'incentive_runs', v_run.id::text, null,
    jsonb_build_object('period', p_period, 'rate_version', (select version_no from rate_versions where id = v_ver),
                       'total', v_run.total_incentive));
  return v_run;
end $$;

-- Kiểm tra & sinh thông báo (thay cho batch/cron — chạy bằng nút bấm)
-- Email là MOCK: không gửi thật; địa chỉ chứa 'fail' giả lập lỗi để thấy retry 3 lần → hàng đợi cảnh báo.
create or replace function run_notification_checks(p_user uuid) returns int language plpgsql as $$
declare s notification_settings; r record; v_count int := 0; v_role text; v_email text;
  procedure_insert text;
begin
  for s in select * from notification_settings where enabled loop
    for r in
      select 'QUAL_EXPIRING'::text as ev, p.name || ' / ' || q.qual_type || ' ' || q.qual_no || ' → ' || q.valid_to as body,
             '資格の期限切れが近づいています' as tja, 'Tư cách tham gia sắp hết hạn' as tvi, p.email as email
      from qualifications q join parties p on p.id = q.party_id
      where s.event_type = 'QUAL_EXPIRING' and q.status = 'VALID'
        and q.valid_to between jst_today() and jst_today() + s.threshold_days
      union all
      select 'DISPUTE_OVERDUE', d.dispute_no || ' : ' || d.description, '処理期限を過ぎた紛争があります', 'Tranh chấp quá hạn xử lý', null
      from disputes d where s.event_type = 'DISPUTE_OVERDUE' and d.status <> 'RESOLVED' and d.due_date < jst_today()
      union all
      select 'DELIVERY_BACKLOG', t.trade_no || ' (' || t.biz_date || ') ' || t.delivered_qty || '/' || t.quantity,
             '引渡しが滞留しています', 'Giao hàng tồn đọng', null
      from trades t where s.event_type = 'DELIVERY_BACKLOG' and t.status = 'CONFIRMED'
        and t.delivery_status in ('PENDING','PARTIAL') and t.biz_date <= jst_today() - s.threshold_days
    loop
      foreach v_role in array s.recipient_roles loop
        insert into notifications(event_type, severity, channel, target_role, title_ja, title_vi, body)
        values (r.ev, s.severity, 'IN_APP', v_role, r.tja, r.tvi, r.body);
        v_count := v_count + 1;
      end loop;
      if s.email_enabled then
        for v_email in select distinct u.email from app_users u where u.active and u.roles && s.recipient_roles loop
          insert into notifications(event_type, severity, channel, recipient, title_ja, title_vi, body, status, attempts, ops_alert)
          values (r.ev, s.severity, 'EMAIL', v_email, r.tja, r.tvi, r.body,
                  case when v_email like '%fail%' then 'FAILED' else 'SENT' end,
                  case when v_email like '%fail%' then 3 else 1 end,
                  v_email like '%fail%');
          v_count := v_count + 1;
        end loop;
      end if;
    end loop;
  end loop;
  perform write_audit(p_user, 'NOTIFY_RUN', 'notifications', null, null, jsonb_build_object('created', v_count));
  return v_count;
end $$;

-- =====================================================================
-- RLS: chỉ người đã đăng nhập được ĐỌC. Không có policy ghi →
-- mọi thao tác ghi đi qua Next.js API route (kiểm tra vai trò) dùng service role.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['app_users','audit_logs','master_items','holidays','business_days','parties','qualifications',
    'lots','lot_evaluations','trades','correction_requests','trade_adjustments','deliveries','disputes','dispute_updates',
    'rate_versions','rate_tiers','payments','incentive_runs','incentive_results','notification_settings','notifications']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "read_authenticated" on %I', t);
    execute format('create policy "read_authenticated" on %I for select to authenticated using (true)', t);
    execute format('revoke insert, update, delete, truncate, references, trigger on %I from anon, authenticated', t);
    execute format('revoke select on %I from anon', t);
  end loop;
end $$;

-- Audit log: chỉ Quản trị hệ thống / Đối soát được đọc (kể cả khi gọi REST trực tiếp bằng anon key + JWT)
drop policy if exists "read_authenticated" on audit_logs;
drop policy if exists "audit_read_privileged" on audit_logs;
create policy "audit_read_privileged" on audit_logs for select to authenticated
  using (exists (select 1 from app_users u where u.id = auth.uid() and u.active and u.roles && array['SYS_ADMIN','SETTLEMENT']::text[]));

-- Hàm nghiệp vụ chỉ cho service role gọi
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
grant execute on function jst_today(), is_day_locked(date), required_qual_type(text), party_block_reason(uuid, date),
  settlement_summary(date), effective_rate_version(date) to authenticated;
grant usage, select on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant select on all tables in schema public to authenticated;
revoke select on all tables in schema public from anon;

-- Làm mới schema cache của API (PostgREST)
notify pgrst, 'reload schema';
