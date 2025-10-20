export function onlyDigits(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '');
}

export function maskCpfCnpj(v: string | null | undefined): string {
  const d = onlyDigits(v);
  if (!d) return '';
  if (d.length <= 11) {
    return d.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2}).*$/, (_m, a, b, c, d) =>
      [a, b && '.' + b, c && '.' + c, d && '-' + d].filter(Boolean).join('')
    );
  }
  // CNPJ
  return d.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*$/, (_m, a, b, c, d, e) =>
    [a, b && '.' + b, c && '.' + c, d && '/' + d, e && '-' + e].filter(Boolean).join('')
  );
}

export function isValidCpf(digits: string): boolean {
  const cpf = onlyDigits(digits).padStart(11, '0');
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += +cpf[i] * (10 - i);
  let r = (s * 10) % 11; if (r === 10) r = 0; if (r !== +cpf[9]) return false;
  s = 0; for (let i = 0; i < 10; i++) s += +cpf[i] * (11 - i);
  r = (s * 10) % 11; if (r === 10) r = 0; return r === +cpf[10];
}

export function isValidCnpj(digits: string): boolean {
  const c = onlyDigits(digits).padStart(14, '0');
  if (!/^\d{14}$/.test(c)) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;
  const calc = (base: number) => {
    const w = base === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const s = c.slice(0, base).split('').reduce((acc, v, i) => acc + (+v) * w[i], 0);
    const r = s % 11; return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === +c[12] && calc(13) === +c[13];
}
