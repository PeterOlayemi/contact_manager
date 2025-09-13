const profileModal = document.getElementById("profileModal");
const openProfile = document.getElementById("openProfile");
const closeProfile = document.getElementById("closeProfile");

if (openProfile && profileModal && closeProfile) {
openProfile.addEventListener("click", (e) => {
    e.preventDefault();
    profileModal.classList.remove("hidden");
    profileModal.classList.add("flex");
});

closeProfile.addEventListener("click", () => {
    profileModal.classList.add("hidden");
    profileModal.classList.remove("flex");
});

// Close when clicking outside modal content
profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) {
    profileModal.classList.add("hidden");
    profileModal.classList.remove("flex");
    }
});
}
