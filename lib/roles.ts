export const ROLES = ["SYS_ADMIN", "INTAKE", "JUDGE", "TRADE", "DELIVERY", "SETTLEMENT", "RULE_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Ma trận quyền: thao tác ghi → vai trò được phép (đọc: mọi người đã đăng nhập). */
export const PERM = {
  partyWrite: ["SYS_ADMIN", "SETTLEMENT"],
  lotCreate: ["INTAKE"],
  lotEvaluate: ["JUDGE"],
  lotPublish: ["INTAKE", "TRADE"],
  tradeWrite: ["TRADE"],
  deliveryWrite: ["DELIVERY"],
  settlement: ["SETTLEMENT"],
  disputeWrite: ["SETTLEMENT", "DELIVERY", "TRADE"],
  correctionRequest: ["TRADE", "DELIVERY", "SETTLEMENT"],
  correctionReview: ["SETTLEMENT"],
  rateDraft: ["RULE_ADMIN"],
  rateReview: ["RULE_ADMIN", "SETTLEMENT"],
  incentiveRun: ["SETTLEMENT"],
  accountingExport: ["SETTLEMENT"],
  notifySettings: ["SYS_ADMIN"],
  notifyRun: ["SYS_ADMIN", "SETTLEMENT"],
  auditRead: ["SYS_ADMIN", "SETTLEMENT"],
  admin: ["SYS_ADMIN"],
} satisfies Record<string, Role[]>;

export function can(userRoles: string[] | undefined, perm: keyof typeof PERM) {
  return !!userRoles && (PERM[perm] as readonly string[]).some((r) => userRoles.includes(r));
}
