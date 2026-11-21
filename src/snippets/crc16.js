// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), dipakai QRIS di tag 63
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// CRC dihitung atas seluruh string sampai "6304", tanpa 4 karakter terakhir
const qrisValid = (qris) => crc16(qris.slice(0, -4)) === qris.slice(-4).toUpperCase();
