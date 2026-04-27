const AUTH_STORAGE_KEY = "auth-session";

function getAuthFormValues() {
    return {
        login: document.getElementById("input-login").value.trim(),
        password: document.getElementById("input-pass").value,
    };
}

async function sendAuthRequest(url, payload) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

function persistUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function redirectToDashboard() {
    window.location.href = "/dashboard";
}

async function login() {
    const { login, password } = getAuthFormValues();

    if (!login || !password) {
        alert("Login and password are required");
        return;
    }

    try {
        const data = await sendAuthRequest("/api/login", { login, password });
        persistUser({ user: data.user, token: data.token });
        redirectToDashboard();
    } catch (error) {
        alert(error.message);
    }
}

async function register() {
    const { login, password } = getAuthFormValues();

    if (!login || !password) {
        alert("Login and password are required");
        return;
    }

    try {
        const data = await sendAuthRequest("/api/register", { login, password });
        persistUser({ user: data.user, token: data.token });
        redirectToDashboard();
    } catch (error) {
        alert(error.message);
    }
}
