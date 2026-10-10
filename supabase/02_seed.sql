-- =====================================================================
-- 02_seed.sql : tài khoản demo + dữ liệu mẫu (MOCK, hư cấu hoàn toàn)
-- Chạy SAU 01_schema.sql. Ngày tháng tính tương đối theo "hôm nay" (JST)
-- nên dữ liệu luôn trông như mới, chạy lại được (xóa dữ liệu cũ trước).
-- Mật khẩu mọi tài khoản demo: Demo@2026
-- =====================================================================
set search_path = public, extensions;

-- ---------- Xóa dữ liệu cũ (để chạy lại) ----------
truncate audit_logs, notifications, notification_settings, incentive_results, incentive_runs, payments,
  rate_tiers, rate_versions, dispute_updates, disputes, deliveries, trade_adjustments, correction_requests,
  trades, lot_evaluations, lots, qualifications, parties, business_days, holidays, master_items restart identity cascade;
delete from app_users;
delete from auth.identities where user_id in (select id from auth.users where email like '%@demo.sakura-ichiba.example');
delete from auth.users where email like '%@demo.sakura-ichiba.example';

-- ---------- Tài khoản demo (Supabase Auth) ----------
do $$
declare r record;
begin
  for r in select * from (values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'admin',    'システム管理者 (Admin)',   array['SYS_ADMIN','INTAKE','JUDGE','TRADE','DELIVERY','SETTLEMENT','RULE_ADMIN']),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'intake',   '受付・評価担当 (Intake)',  array['INTAKE','JUDGE']),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'trade',    '取引担当 (Trade)',         array['TRADE']),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'delivery', '引渡し担当 (Delivery)',    array['DELIVERY']),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'settle',   '照合担当 (Settlement)',    array['SETTLEMENT']),
    ('00000000-0000-4000-a000-000000000006'::uuid, 'settle2',  '照合責任者 (Settlement 2)', array['SETTLEMENT']),
    ('00000000-0000-4000-a000-000000000007'::uuid, 'rule',     '規程管理者 (Rule admin)',  array['RULE_ADMIN'])
  ) as t(id, name, display, roles)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', r.id, 'authenticated', 'authenticated',
      r.name || '@demo.sakura-ichiba.example', crypt('Demo@2026', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', r.display), now(), now(),
      '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), r.id, r.id::text,
      jsonb_build_object('sub', r.id::text, 'email', r.name || '@demo.sakura-ichiba.example', 'email_verified', true),
      'email', now(), now(), now());
    insert into app_users(id, email, display_name, roles)
    values (r.id, r.name || '@demo.sakura-ichiba.example', r.display, r.roles);
  end loop;
end $$;

-- ---------- Danh mục ----------
insert into master_items(category, code, name_ja, name_vi, sort) values
 ('ITEM','TUNA','マグロ','Cá ngừ',1),('ITEM','BURI','ブリ','Cá cam',2),('ITEM','SABA','サバ','Cá thu',3),
 ('ITEM','AJI','アジ','Cá sòng',4),('ITEM','IKA','イカ','Mực',5),('ITEM','TAI','タイ','Cá tráp',6),
 ('ITEM','SAKE','サケ','Cá hồi',7),('ITEM','KATSUO','カツオ','Cá ngừ vằn',8),('ITEM','HOTATE','ホタテ','Sò điệp',9),
 ('ITEM','EBI','エビ','Tôm',10),
 ('UNIT','KG','kg','kg',1),('UNIT','CASE','ケース','Thùng',2),('UNIT','PCS','尾','Con',3),
 ('GRADE','A','特選 (A)','Loại đặc biệt (A)',1),('GRADE','B','上 (B)','Loại tốt (B)',2),('GRADE','C','並 (C)','Loại thường (C)',3),
 ('DELIVERY_EXCEPTION','SHORT','不足','Giao thiếu',1),('DELIVERY_EXCEPTION','OVER','過剰','Giao thừa',2),
 ('DELIVERY_EXCEPTION','RETURN','返品','Trả hàng',3),('DELIVERY_EXCEPTION','PARTIAL_CANCEL','一部取消','Hủy một phần',4),
 ('DISPUTE_CAUSE','PRICE','単価相違','Sai lệch đơn giá',1),('DISPUTE_CAUSE','QTY','数量相違','Sai lệch số lượng',2),
 ('DISPUTE_CAUSE','QUALITY','品質クレーム','Khiếu nại chất lượng',3),('DISPUTE_CAUSE','OTHER','その他','Khác',4);

insert into holidays(holiday, name) values
 ('2026-11-03','文化の日 / 休市'), ('2026-11-23','勤労感謝の日 / 休市'), ('2026-12-31','年末休市'),
 ('2027-01-01','元日 / 休市'), ('2027-01-02','年始休市'), ('2027-01-03','年始休市');

-- ---------- Người tham gia & tư cách ----------
insert into parties(code, kind, name, name_kana, phone, email, participation_limit, status) values
 ('W-001','WHOLESALER','桜浜水産卸 株式会社','サクラハマスイサンオロシ','045-000-1001','w001@example.com',null,'ACTIVE'),
 ('W-002','WHOLESALER','港南魚類 株式会社','コウナンギョルイ','045-000-1002','w002@example.com',null,'ACTIVE'),
 ('W-003','WHOLESALER','東湾水産 株式会社','トウワンスイサン','045-000-1003','w003@example.com',null,'ACTIVE'),
 ('N-101','INTERMEDIARY','丸一鮮魚店','マルイチセンギョテン','045-000-2101','n101@example.com',null,'ACTIVE'),
 ('N-102','INTERMEDIARY','山田水産','ヤマダスイサン','045-000-2102','n102@example.com',null,'ACTIVE'),
 ('N-103','INTERMEDIARY','魚辰商店','ウオタツショウテン','045-000-2103','n103@example.com',null,'ACTIVE'),
 ('N-104','INTERMEDIARY','浜松鮮魚 (許可期限切れ)','ハママツセンギョ','045-000-2104','n104@example.com',null,'ACTIVE'),
 ('N-105','INTERMEDIARY','海幸 (許可期限間近)','ウミサチ','045-000-2105','n105@example.com',null,'ACTIVE'),
 ('B-201','APPROVED_BUYER','さくら寿司チェーン','サクラスシチェーン','045-000-3201','b201@example.com',5000000,'ACTIVE'),
 ('B-202','APPROVED_BUYER','港町ホテル','ミナトマチホテル','045-000-3202','b202@example.com',3000000,'ACTIVE'),
 ('B-203','APPROVED_BUYER','青葉給食 (承認停止中)','アオバキュウショク','045-000-3203','b203@example.com',2000000,'ACTIVE'),
 ('B-204','APPROVED_BUYER','湾岸スーパー','ワンガンスーパー','045-000-3204','b204@example.com',8000000,'ACTIVE'),
 ('K-301','MARKET_BUYER','居酒屋 はま','イザカヤハマ','045-000-4301',null,null,'ACTIVE'),
 ('K-302','MARKET_BUYER','鮨 一心','スシイッシン','045-000-4302',null,null,'ACTIVE'),
 ('K-303','MARKET_BUYER','割烹 さわ','カッポウサワ','045-000-4303',null,null,'ACTIVE'),
 ('K-304','MARKET_BUYER','食堂 みなと (取引停止)','ショクドウミナト','045-000-4304',null,null,'SUSPENDED');

do $$
declare d date := jst_today(); p record; v_from date; v_to date; v_status text;
begin
  for p in select * from parties loop
    v_from := d - 700; v_to := d + 300; v_status := 'VALID';
    if p.code = 'N-104' then v_to := d - 10; end if;           -- 許可 hết hạn
    if p.code = 'N-105' then v_to := d + 12; end if;           -- 許可 sắp hết hạn
    if p.code = 'B-203' then v_status := 'SUSPENDED'; end if;  -- 承認 bị tạm ngừng
    if p.code = 'B-202' then v_to := d + 25; end if;
    insert into qualifications(party_id, qual_type, qual_no, valid_from, valid_to, status, note)
    values (p.id, required_qual_type(p.kind),
            case required_qual_type(p.kind) when 'PERMIT' then '許可第' when 'APPROVAL' then '承認第' else '登録第' end
              || substr(p.code, 3) || '号', v_from, v_to, v_status,
            case when p.code = 'B-203' then '支払遅延のため一時停止 (mock)' end);
  end loop;
end $$;

-- ---------- Lot, đánh giá, giao dịch, giao hàng (7 ngày gần nhất) ----------
select setseed(0.42);
do $$
declare
  d0 date := jst_today(); d date; i int; k int; n int;
  u_intake uuid := '00000000-0000-4000-a000-000000000002';
  u_trade uuid := '00000000-0000-4000-a000-000000000003';
  u_del uuid := '00000000-0000-4000-a000-000000000004';
  items text[] := array['TUNA','BURI','SABA','AJI','IKA','TAI','SAKE','KATSUO','HOTATE','EBI'];
  prices int[] := array[3800,1500,600,700,900,1800,1200,1100,1600,2500];
  origins text[] := array['桜浜港','銚子','焼津','気仙沼','三崎','境港'];
  v_lot lots; v_tr trades; v_buyer uuid; v_qty numeric; v_idx int; v_type text; v_avail numeric;
  buyers uuid[]; v_w text;
begin
  select array_agg(id order by code) into buyers from parties
   where code in ('N-101','N-102','N-103','N-105','B-201','B-202','B-204','K-301','K-302','K-303');
  for k in reverse 6..0 loop
    d := d0 - k;
    n := 4 + (random() * 2)::int;
    for i in 1..n loop
      v_idx := 1 + floor(random() * 10)::int;
      v_w := (array['W-001','W-002','W-003'])[1 + floor(random()*3)::int];
      v_lot := create_lot(u_intake, d,
        (select id from parties where code = v_w),
        items[v_idx], (50 + floor(random() * 30) * 10)::numeric, 'KG',
        origins[1 + floor(random()*6)::int], '第' || (1 + floor(random()*20)::int) || '丸', 'T-' || lpad((k*10+i)::text, 3, '0'), null);
      -- Lot cuối của hôm nay để ở trạng thái mới tiếp nhận (chưa đánh giá)
      if k = 0 and i >= n - 1 then continue; end if;
      perform record_evaluation(u_intake, v_lot.id, (array['A','B','B','C'])[1 + floor(random()*4)::int],
        (array['極上','良好','良好','普通'])[1 + floor(random()*4)::int], '目利き: 佐藤 (mock)', null);
      if k = 0 and i = n - 2 then continue; end if;   -- 1 lot đã đánh giá nhưng chưa công khai
      perform publish_lot(u_trade, v_lot.id);
      -- 1–3 giao dịch / lot, khoảng 90% 相対, 10% せり
      for v_idx in 1..(1 + floor(random()*3)::int) loop
        select quantity_available into v_avail from lots where id = v_lot.id;
        exit when v_avail <= 0;
        v_qty := least(v_avail, (10 + floor(random() * 8) * 10)::numeric);
        if random() > 0.85 then v_qty := v_avail; end if;
        v_type := case when random() < 0.9 then 'AITAI' else 'SERI' end;
        v_buyer := buyers[1 + floor(random() * array_length(buyers, 1))::int];
        v_tr := confirm_trade(u_trade, v_type, d, v_lot.id, v_buyer, v_qty,
          (prices[array_position(items, v_lot.item_code)] * (0.8 + random() * 0.5))::int,
          case when v_type = 'SERI' then 'B-' || (10 + floor(random()*30)::int) end,
          case when v_type = 'SERI' then 'せり人: 高橋 (mock)' end, null);
        -- Giao hàng: ngày cũ phần lớn đã giao xong; hôm qua/hôm nay còn tồn
        if k >= 2 then
          if random() < 0.25 then
            perform record_delivery(u_del, v_tr.id, floor(v_qty / 2), null, null);
            perform record_delivery(u_del, v_tr.id, v_qty - floor(v_qty / 2), null, null);
          elsif random() < 0.08 then
            perform record_delivery(u_del, v_tr.id, v_qty - 10, 'SHORT', '箱破損により10kg不足 (mock)');
          else
            perform record_delivery(u_del, v_tr.id, v_qty, null, null);
          end if;
        elsif k = 1 and random() < 0.5 then
          perform record_delivery(u_del, v_tr.id, floor(v_qty / 2), null, null);
        end if;
      end loop;
    end loop;
  end loop;
end $$;

-- Một vài giao dịch ngày cũ còn tồn để thấy cảnh báo giao hàng tồn đọng
update trades set delivery_status = 'PENDING', delivered_qty = 0
where id in (select id from trades where biz_date = jst_today() - 3 and delivery_status = 'COMPLETED' order by trade_no limit 1);
delete from deliveries where trade_id in (select id from trades where biz_date = jst_today() - 3 and delivery_status = 'PENDING' and delivered_qty = 0);

-- ---------- Tranh chấp ----------
insert into disputes(dispute_no, biz_date, trade_id, cause_code, description, assignee, due_date, status, resolution, created_by)
select 'D-' || to_char(jst_today()-4,'YYMMDD') || '-01', jst_today()-4, (select id from trades where biz_date = jst_today()-4 order by trade_no limit 1),
       'PRICE', '電話での合意単価と取引票の単価が相違 (mock)', '照合担当 (Settlement)', jst_today()-1, 'OPEN', null,
       '00000000-0000-4000-a000-000000000005'::uuid
union all
select 'D-' || to_char(jst_today()-2,'YYMMDD') || '-01', jst_today()-2, (select id from trades where biz_date = jst_today()-2 order by trade_no limit 1 offset 1),
       'QTY', '引渡し数量の認識相違 (mock)', '引渡し担当 (Delivery)', jst_today()+3, 'IN_PROGRESS', null,
       '00000000-0000-4000-a000-000000000005'
union all
select 'D-' || to_char(jst_today()-5,'YYMMDD') || '-01', jst_today()-5, null,
       'QUALITY', '鮮度に関するクレーム (mock)', '照合担当 (Settlement)', jst_today()-3, 'RESOLVED', '買い手と協議のうえ値引きで合意',
       '00000000-0000-4000-a000-000000000005';
insert into dispute_updates(dispute_id, status, note, updated_by)
select id, status, '登録 (mock)', '00000000-0000-4000-a000-000000000005' from disputes;

-- ---------- Khóa các ngày cũ (D-6 .. D-2) ----------
do $$
declare k int;
begin
  for k in 2..6 loop
    perform lock_business_day('00000000-0000-4000-a000-000000000005', jst_today() - k, '日次照合完了 (mock)');
  end loop;
end $$;

-- ---------- Sửa sau chốt: 1 đã duyệt (ngày gốc đã khóa → delta vào hôm nay), 1 đang chờ ----------
do $$
declare v_t trades_effective; v correction_requests;
begin
  select * into v_t from trades_effective where biz_date = jst_today() - 3 and status = 'CONFIRMED'
    and delivery_status <> 'COMPLETED' order by trade_no limit 1;
  if v_t.id is not null then
    v := request_correction('00000000-0000-4000-a000-000000000003', v_t.id, v_t.eff_quantity, v_t.eff_unit_price - 100,
      '電話合意単価の入力誤り (mock)', '取引票 No.123 のコピーを確認');
    perform review_correction('00000000-0000-4000-a000-000000000006', v.id, true, '取引票と照合済み');
  end if;
  select * into v_t from trades_effective where biz_date = jst_today() - 1 and status = 'CONFIRMED'
    order by trade_no limit 1;
  if v_t.id is not null then
    perform request_correction('00000000-0000-4000-a000-000000000004', v_t.id, v_t.eff_quantity - 10, v_t.eff_unit_price,
      '引渡し時に10kg不足が判明 (mock)', '引渡し票の写真あり (mock)');
  end if;
end $$;

-- ---------- Version tỷ lệ thưởng ----------
insert into rate_versions(id, version_no, effective_from, status, note, created_by, approved_by, approved_at, created_at)
values
 ('00000000-0000-4000-b000-000000000001', 1, date_trunc('year', jst_today())::date, 'APPROVED', '年初版 (mock)',
  '00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000006', now() - interval '300 days', now() - interval '310 days'),
 ('00000000-0000-4000-b000-000000000002', 2, (date_trunc('month', jst_today()) - interval '3 months')::date, 'APPROVED', '料率改定 (mock)',
  '00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000006', now() - interval '100 days', now() - interval '110 days');
insert into rate_tiers(version_id, min_amount, rate) values
 ('00000000-0000-4000-b000-000000000001', 0, 0.0030), ('00000000-0000-4000-b000-000000000001', 1000000, 0.0050),
 ('00000000-0000-4000-b000-000000000001', 3000000, 0.0080),
 ('00000000-0000-4000-b000-000000000002', 0, 0.0040), ('00000000-0000-4000-b000-000000000002', 1000000, 0.0060),
 ('00000000-0000-4000-b000-000000000002', 3000000, 0.0100);
select save_rate_version('00000000-0000-4000-a000-000000000007', null, jst_today() + 30, '次期改定案 (mock)',
  '[{"min_amount":0,"rate":0.0045},{"min_amount":1000000,"rate":0.0065},{"min_amount":3000000,"rate":0.0110}]'::jsonb);

-- ---------- Thanh toán (MOCK) cho 2 tháng trước ----------
do $$
declare p record; m int; v_period text; v_due date; v_billed numeric; v_paid date;
begin
  for m in 1..2 loop
    v_period := to_char(date_trunc('month', jst_today()) - make_interval(months => m), 'YYYY-MM');
    v_due := (date_trunc('month', jst_today()) - make_interval(months => m - 1))::date + 9;  -- ngày 10 tháng kế tiếp
    for p in select * from parties where kind <> 'WHOLESALER' and status = 'ACTIVE' order by code loop
      v_billed := (300000 + floor(random() * 50) * 100000);
      v_paid := case
        when p.code in ('N-103') then v_due + 2      -- trả trễ 2 ngày → thưởng = 0
        when p.code in ('K-303') then null           -- chưa trả
        when p.code = 'B-202' then v_due             -- trả đúng ngày hạn
        else v_due - (1 + floor(random()*5)::int) end;
      insert into payments(party_id, period, billed_amount, due_date, paid_amount, paid_date)
      values (p.id, v_period, v_billed, v_due, case when v_paid is null then 0 else v_billed end, v_paid);
    end loop;
  end loop;
end $$;
select run_incentive('00000000-0000-4000-a000-000000000005',
  to_char(date_trunc('month', jst_today()) - interval '2 months', 'YYYY-MM'));

-- ---------- Cài đặt & thông báo ----------
insert into notification_settings(event_type, enabled, severity, recipient_roles, threshold_days, email_enabled) values
 ('QUAL_EXPIRING', true, 'INFO', array['SETTLEMENT','SYS_ADMIN'], 30, true),
 ('DISPUTE_OVERDUE', true, 'CRITICAL', array['SETTLEMENT'], 0, true),
 ('DELIVERY_BACKLOG', true, 'CRITICAL', array['DELIVERY','SETTLEMENT'], 1, true),
 ('EXPORT_FAILED', true, 'CRITICAL', array['SETTLEMENT','SYS_ADMIN'], 0, true);
select run_notification_checks('00000000-0000-4000-a000-000000000001');
