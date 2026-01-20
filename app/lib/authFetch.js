export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });

  // 🔥 ถ้า login ซ้ำ / token หมดอายุ
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/Login";
    throw new Error("Session expired");
  }

  return res;
}
