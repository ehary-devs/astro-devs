SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"]
SKALA = ["", "ribu", "juta", "miliar", "triliun"]


def _ratusan(n: int) -> str:
    r, s = divmod(n, 100)
    out = []
    if r == 1:
        out.append("seratus")
    elif r > 1:
        out += [SATUAN[r], "ratus"]
    if s >= 20:
        out += [SATUAN[s // 10], "puluh", SATUAN[s % 10]]
    elif s >= 12:
        out += [SATUAN[s - 10], "belas"]
    elif s == 11:
        out.append("sebelas")
    elif s == 10:
        out.append("sepuluh")
    else:
        out.append(SATUAN[s])
    return " ".join(w for w in out if w)


def terbilang(n: int) -> str:
    """Bilangan bulat 0 sampai 999 triliun."""
    if n == 0:
        return "nol"
    if n < 0:
        return "minus " + terbilang(-n)
    parts = []
    i = 0
    while n > 0:
        n, g = divmod(n, 1000)
        if g:
            if i >= len(SKALA):
                raise ValueError("Angka terlalu besar")
            parts.insert(0, "seribu" if i == 1 and g == 1 else " ".join(w for w in (_ratusan(g), SKALA[i]) if w))
        i += 1
    return " ".join(parts)


print(terbilang(1250000))  # satu juta dua ratus lima puluh ribu
