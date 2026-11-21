<?php
function crc16(string $str): string {
    $crc = 0xFFFF;
    for ($i = 0; $i < strlen($str); $i++) {
        $crc ^= ord($str[$i]) << 8;
        for ($b = 0; $b < 8; $b++) {
            $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) & 0xFFFF : ($crc << 1) & 0xFFFF;
        }
    }
    return str_pad(strtoupper(dechex($crc)), 4, '0', STR_PAD_LEFT);
}

function qris_valid(string $qris): bool {
    return crc16(substr($qris, 0, -4)) === strtoupper(substr($qris, -4));
}
