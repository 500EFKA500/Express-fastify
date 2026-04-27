const AUTH_STORAGE_KEY = "auth-session";
let profileServiceUrl = "";

async function getProfileServiceUrl() {
    if (profileServiceUrl) {
        return profileServiceUrl;
    }

    const res = await fetch("/api/config");
    const data = await res.json();

    if (!res.ok || !data.success || !data.profileServiceUrl) {
        throw new Error("Failed to load app config");
    }

    profileServiceUrl = data.profileServiceUrl;
    return profileServiceUrl;
}

function getCurrentSession() {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession);
    } catch {
        return null;
    }
}

function requireSession() {
    const session = getCurrentSession();

    if (!session?.user?.login || !session?.token) {
        window.location.href = "/";
        return null;
    }

    return session;
}

function renderUser(user) {
    document.getElementById("user-info").textContent = `User: ${user.login}`;
}

function renderProfile(profile) {
    document.getElementById("fullName").value = profile.fullName || "";
    document.getElementById("bio").value = profile.bio || "";
    document.getElementById("birthDate").value = profile.birthDate || "";
    document.getElementById("profile-info").textContent = profile.fullName
        ? `Profile: ${profile.fullName}`
        : "Profile is empty";
}

async function loadProfile(session) {
    const baseUrl = await getProfileServiceUrl();
    const res = await fetch(`${baseUrl}/api/profile`, {
        headers: {
            authorization: `Bearer ${session.token}`,
        },
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load profile");
    }

    renderProfile(data.profile);
}

async function saveProfile(session) {
    const baseUrl = await getProfileServiceUrl();
    const payload = {
        fullName: document.getElementById("fullName").value.trim(),
        bio: document.getElementById("bio").value.trim(),
        birthDate: document.getElementById("birthDate").value,
    };

    const res = await fetch(`${baseUrl}/api/profile`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile");
    }

    renderProfile(data.profile);
    alert(data.message);
}

function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = "/";
}

async function initDashboard() {
    const session = requireSession();

    if (!session) {
        return;
    }

    renderUser(session.user);

    document.getElementById("saveProfile").addEventListener("click", async () => {
        try {
            await saveProfile(session);
        } catch (error) {
            alert(error.message);
        }
    });

    document.getElementById("logout").addEventListener("click", logout);

    try {
        await loadProfile(session);
    } catch (error) {
        document.getElementById("profile-info").textContent = error.message;
    }
}

window.addEventListener("DOMContentLoaded", initDashboard);
