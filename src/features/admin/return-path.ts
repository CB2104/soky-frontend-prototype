export function safeAdminReturn(value: string | null | undefined, adminPath: string) {
  const fallback = `/${adminPath}`;
  if (!value || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value) || /%(?:2f|5c)/i.test(value)) return fallback;
  try {
    const url = new URL(value, "https://soky.test");
    const decoded = decodeURIComponent(url.pathname);
    if (url.origin !== "https://soky.test" || /[\\\u0000-\u0020]/.test(decoded) || decoded.includes("%") || !(decoded === fallback || decoded.startsWith(`${fallback}/`)) || decoded === `${fallback}/login` || decoded.startsWith(`${fallback}/login/`)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
