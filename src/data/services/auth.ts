import http from "./axios";

function authenticate(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  idNumber: string;
}) {
  return http.post("/auth/register", formData);
}
function login(email: string, password: string) {
  return http.post("/auth/login", { email, password });
}
function registerAdmin(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  idNumber: string;
}) {
  return http.post("/auth/register-HiAdmin", formData);
}
function logout(email: string) {
  return http.post("/auth/logout", { email });
}
export default { login, authenticate, logout, registerAdmin };
