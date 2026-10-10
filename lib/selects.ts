export const SELECT_TRADE =
  "*, lot:lots!trades_lot_id_fkey(id, lot_no, item_code, unit), buyer:parties!trades_buyer_id_fkey(id, code, name, kind), seller:parties!trades_seller_id_fkey(id, code, name)";
