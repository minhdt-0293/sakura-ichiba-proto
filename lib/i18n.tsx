"use client";
import { createContext, useCallback, useContext, useState, ReactNode } from "react";

export type Lang = "ja" | "vi";
type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: "ja", setLang: () => {} });

export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const setLang = useCallback((l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
    setLangState(l);
  }, []);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

/** t("日本語", "Tiếng Việt") — mỗi chuỗi giao diện viết song ngữ ngay tại chỗ dùng. */
export function useT() {
  const { lang } = useContext(LangCtx);
  return useCallback((ja: string, vi: string) => (lang === "ja" ? ja : vi), [lang]);
}

type Pair = [string, string];
const L = (ja: string, vi: string): Pair => [ja, vi];

/** Nhãn cho các giá trị enum trong DB */
export const ENUM: Record<string, Record<string, Pair>> = {
  role: {
    SYS_ADMIN: L("システム管理", "Quản trị hệ thống"),
    INTAKE: L("ロット受付", "Tiếp nhận lot"),
    JUDGE: L("評価記録", "Ghi đánh giá"),
    TRADE: L("取引", "Giao dịch"),
    DELIVERY: L("引渡し", "Giao hàng"),
    SETTLEMENT: L("照合・締め", "Đối soát"),
    RULE_ADMIN: L("規程管理", "Quản trị quy định"),
  },
  partyKind: {
    WHOLESALER: L("卸売業者", "Đơn vị bán buôn"),
    INTERMEDIARY: L("仲卸", "Trung gian (仲卸)"),
    APPROVED_BUYER: L("売買参加者", "Người tham gia mua bán"),
    MARKET_BUYER: L("買出人", "Người mua tại chợ"),
  },
  partyStatus: {
    ACTIVE: L("有効", "Hoạt động"),
    SUSPENDED: L("取引停止", "Tạm ngừng"),
    INACTIVE: L("無効", "Ngừng"),
  },
  qualType: {
    REGISTRATION: L("登録", "Đăng ký"),
    PERMIT: L("許可", "Giấy phép (許可)"),
    APPROVAL: L("承認", "Chấp thuận (承認)"),
  },
  qualStatus: {
    VALID: L("有効", "Hiệu lực"),
    SUSPENDED: L("停止中", "Tạm ngừng"),
    REVOKED: L("取消", "Thu hồi"),
  },
  lotStatus: {
    RECEIVED: L("受付済", "Đã tiếp nhận"),
    INSPECTED: L("評価済", "Đã đánh giá"),
    ON_SALE: L("販売中", "Đang bán"),
    SOLD_OUT: L("完売", "Đã bán hết"),
  },
  tradeType: { AITAI: L("相対取引", "Thỏa thuận (相対)"), SERI: L("せり", "Đấu giá (せり)") },
  tradeStatus: { CONFIRMED: L("確定", "Đã chốt"), CANCELLED: L("取消", "Đã hủy") },
  deliveryStatus: {
    PENDING: L("未引渡し", "Chưa giao"),
    PARTIAL: L("一部引渡し", "Giao một phần"),
    COMPLETED: L("引渡し完了", "Đã giao xong"),
    EXCEPTION: L("例外", "Ngoại lệ"),
  },
  exception: {
    SHORT: L("不足", "Giao thiếu"),
    OVER: L("過剰", "Giao thừa"),
    RETURN: L("返品", "Trả hàng"),
    PARTIAL_CANCEL: L("一部取消", "Hủy một phần"),
  },
  dayStatus: { OPEN: L("未締め", "Chưa khóa"), LOCKED: L("締め済", "Đã khóa") },
  disputeStatus: { OPEN: L("未対応", "Mới"), IN_PROGRESS: L("対応中", "Đang xử lý"), RESOLVED: L("解決済", "Đã giải quyết") },
  reqStatus: { PENDING: L("承認待ち", "Chờ duyệt"), APPROVED: L("承認済", "Đã duyệt"), REJECTED: L("却下", "Bị bác") },
  rateStatus: { DRAFT: L("下書き", "Bản nháp"), APPROVED: L("承認済", "Đã duyệt"), REJECTED: L("却下", "Bị bác") },
  payReason: { ON_TIME: L("期日内", "Trong hạn"), LATE: L("期日超過", "Trễ hạn"), UNPAID: L("未払い", "Chưa trả") },
  event: {
    QUAL_EXPIRING: L("資格期限間近", "Tư cách sắp hết hạn"),
    DISPUTE_OVERDUE: L("紛争の期限超過", "Tranh chấp quá hạn"),
    DELIVERY_BACKLOG: L("引渡し滞留", "Giao hàng tồn đọng"),
    EXPORT_FAILED: L("出力エラー", "Lỗi xuất file"),
  },
  channel: { IN_APP: L("アプリ内", "Trong app"), EMAIL: L("メール", "Email") },
  sendStatus: { SENT: L("送信済", "Đã gửi"), FAILED: L("失敗", "Thất bại") },
  severity: { INFO: L("通常", "Thường"), CRITICAL: L("重要", "Khẩn") },
  auditResult: { OK: L("成功", "Thành công"), BLOCKED: L("ブロック", "Bị chặn") },
};

export function useEnum() {
  const { lang } = useContext(LangCtx);
  return useCallback(
    (group: string, value: string | null | undefined) => {
      if (!value) return "";
      const p = ENUM[group]?.[value];
      return p ? p[lang === "ja" ? 0 : 1] : value;
    },
    [lang]
  );
}

/** Thông báo lỗi nghiệp vụ trả về từ API */
export const ERRORS: Record<string, Pair> = {
  UNAUTHORIZED: L("ログインが必要です。", "Cần đăng nhập."),
  FORBIDDEN: L("この操作の権限がありません。", "Bạn không có quyền thực hiện thao tác này."),
  REQUIRED: L("必須項目が未入力です", "Chưa nhập trường bắt buộc"),
  NOT_NUMBER: L("数値を入力してください", "Vui lòng nhập số"),
  OUT_OF_RANGE: L("値が範囲外です", "Giá trị ngoài phạm vi"),
  BAD_DATE: L("日付の形式が不正です", "Ngày không đúng định dạng"),
  NOT_FOUND: L("データが見つかりません。", "Không tìm thấy dữ liệu."),
  DUPLICATE: L("同じコードが既に存在します。", "Mã này đã tồn tại."),
  DAY_LOCKED: L("この業務日は締め済のため変更できません。訂正申請を使用してください。", "Ngày nghiệp vụ đã khóa, không sửa trực tiếp được. Hãy dùng yêu cầu sửa."),
  DAY_ALREADY_LOCKED: L("この業務日は既に締め済です。", "Ngày này đã được khóa."),
  FUTURE_DATE: L("未来の日付は締めできません。", "Không khóa được ngày trong tương lai."),
  PARTY_BLOCKED: L("買い手の参加資格が無効のため確定できません", "Bên mua không có tư cách tham gia hợp lệ, không chốt được"),
  SELLER_BLOCKED: L("卸売業者の登録が無効です", "Đăng ký của đơn vị bán buôn không hợp lệ"),
  NO_VALID_PERMIT: L("有効な許可がありません", "không có giấy phép (許可) còn hiệu lực"),
  NO_VALID_APPROVAL: L("有効な承認がありません", "không có chấp thuận (承認) còn hiệu lực"),
  NO_VALID_REGISTRATION: L("有効な登録がありません", "không có đăng ký còn hiệu lực"),
  PARTY_SUSPENDED: L("取引停止中です", "đang bị tạm ngừng"),
  PARTY_INACTIVE: L("無効な参加者です", "không còn hoạt động"),
  QTY_EXCEEDS_AVAILABLE: L("販売可能数量を超えています。販売可能数量", "Vượt quá số lượng khả dụng. Còn lại"),
  QTY_INVALID: L("数量が不正です", "Số lượng không hợp lệ"),
  LOT_NOT_ON_SALE: L("このロットは販売中ではありません", "Lot này chưa ở trạng thái đang bán"),
  LOT_NOT_INSPECTED: L("評価結果の記録後に公開できます", "Phải ghi kết quả đánh giá trước khi công khai"),
  NOT_WHOLESALER: L("卸売業者を選択してください", "Hãy chọn đơn vị bán buôn"),
  BUYER_KIND_INVALID: L("買い手の種別が不正です", "Loại bên mua không hợp lệ"),
  SERI_CONFIRMER_REQUIRED: L("せり結果の確認者を入力してください", "Nhập người xác nhận kết quả せり"),
  REASON_REQUIRED: L("理由を入力してください", "Vui lòng nhập lý do"),
  TRADE_NOT_CONFIRMED: L("確定済の取引ではありません", "Giao dịch không ở trạng thái đã chốt"),
  TRADE_HAS_DELIVERY: L("引渡し記録があるため取消できません", "Đã có giao hàng, không hủy được"),
  TRADE_HAS_ADJUSTMENT: L("訂正済の取引は取消できません", "Giao dịch đã được sửa, không hủy được"),
  OVER_DELIVERY: L("取引数量を超える引渡しです。残数量", "Giao vượt số lượng giao dịch. Còn lại"),
  DELIVERY_ALREADY_COMPLETED: L("引渡しは完了しています", "Giao hàng đã hoàn tất"),
  EXCEPTION_NOTE_REQUIRED: L("例外の理由を入力してください", "Nhập lý do ngoại lệ"),
  NOT_EXCEPTION: L("例外状態ではありません", "Không ở trạng thái ngoại lệ"),
  NO_CHANGE: L("変更内容がありません", "Không có thay đổi"),
  PENDING_CORRECTION_EXISTS: L("承認待ちの訂正申請が既にあります", "Đã có yêu cầu sửa đang chờ duyệt"),
  SAME_PERSON: L("申請者（起票者）本人は承認できません", "Người lập không được tự duyệt (tách lập–duyệt)"),
  ALREADY_REVIEWED: L("既に処理済です", "Đã được xử lý"),
  BELOW_DELIVERED: L("引渡し済数量を下回る訂正はできません", "Không sửa xuống thấp hơn số đã giao"),
  EFFECTIVE_IN_PAST: L("発効日は本日以降を指定してください", "Ngày hiệu lực phải từ hôm nay trở đi"),
  TIERS_REQUIRED: L("料率を1行以上入力してください", "Nhập ít nhất 1 bậc tỷ lệ"),
  NOT_DRAFT: L("下書きのみ編集・承認できます", "Chỉ sửa/duyệt được bản nháp"),
  RATE_LIMIT_4: L("同一年の料率変更は4回までです", "Mỗi năm tối đa 4 lần đổi tỷ lệ"),
  NO_RATE_VERSION: L("適用できる料率版がありません", "Không có version tỷ lệ áp dụng"),
  NO_PAYMENTS: L("対象期間の支払データがありません", "Kỳ này không có dữ liệu thanh toán"),
  BAD_PERIOD: L("期間の形式が不正です", "Kỳ không đúng định dạng"),
  QUAL_TYPE_MISMATCH: L("参加者種別と資格種別が一致しません（仲卸＝許可、売買参加者＝承認）", "Loại tư cách không khớp loại người tham gia (仲卸 = 許可, 売買参加者 = 承認)"),
  CHECK_VIOLATION: L("入力値が不正です", "Giá trị nhập không hợp lệ"),
  BAD_JSON: L("リクエストが不正です", "Yêu cầu không hợp lệ"),
  WEAK_PASSWORD: L("パスワードは8文字以上にしてください", "Mật khẩu tối thiểu 8 ký tự"),
  CANNOT_DEACTIVATE_SELF: L("自分自身は無効化できません", "Không thể tự khóa tài khoản của mình"),
  DAY_NOT_LOCKED: L("締め前の業務日は出力できません", "Ngày chưa khóa, không xuất được"),
  BAD_TYPE: L("取引種別が不正です", "Loại giao dịch không hợp lệ"),
  SERVER_ERROR: L("システムエラーが発生しました", "Lỗi hệ thống"),
};

export function useErr() {
  const { lang } = useContext(LangCtx);
  return useCallback(
    (code: string, detail?: string | null) => {
      const i = lang === "ja" ? 0 : 1;
      const base = ERRORS[code]?.[i] ?? code;
      if (!detail) return base;
      const d = ERRORS[detail]?.[i] ?? detail;
      return `${base}: ${d}`;
    },
    [lang]
  );
}
