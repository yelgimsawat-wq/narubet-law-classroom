const TOKEN_KEY = "narubet_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

const isEn = () => {
  try {
    return localStorage.getItem("narubet_law_lang") === "en";
  } catch {
    return false;
  }
};

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
  } catch (e) {
    throw new Error(
      e.name === "TimeoutError"
        ? (isEn() ? "Server took too long to respond • Please try again" : "เซิร์ฟเวอร์ตอบช้าเกินไป • ลองใหม่")
        : (isEn() ? "Unable to connect to server • Please check your internet connection" : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ • ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่")
    );
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) window.dispatchEvent(new Event("auth:expired"));
  if (!res.ok) throw new Error(data.error || (isEn() ? `Request failed (${res.status})` : `เกิดข้อผิดพลาด (${res.status})`));
  return data;
}
