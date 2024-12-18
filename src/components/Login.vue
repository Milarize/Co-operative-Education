<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from "../data/stores/auth";
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import Tesseract from 'tesseract.js'

const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const Registeremail = ref('')
const Registerpassword = ref('')
const idNumber = ref('')
const error = ref('')
const touched = ref({ email: false, password: false })
const showRegister = ref(false)
const authStore = useAuthStore();
const router = useRouter();

const emailError = computed(() => {
  if (!touched.value.email) return ''
  if (!email.value) return 'กรุณากรอกชื่อผู้ใช้'
  if (email.value.length < 4) return 'ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร'
  return ''
})

const passwordError = computed(() => {
  if (!touched.value.password) return ''
  if (!password.value) return 'กรุณากรอกรหัสผ่าน'
  if (password.value.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
  return ''
})

const isFormValid = computed(() => {
  return email.value.length >= 4 &&
    password.value.length >= 6 &&
    !emailError.value &&
    !passwordError.value
})

const handleLogin = async (e: Event) => {
  e.preventDefault()
  touched.value.email = true
  touched.value.password = true

  if (!isFormValid.value) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'กรุณาตรวจสอบข้อมูลให้ถูกต้อง'
    })
    return
  }

  try {
    const response = await authStore.login(email.value, password.value)

    if (!response || response.status !== 201) {
      throw new Error('การเข้าสู่ระบบล้มเหลว');
    }

    Swal.fire({
      icon: 'success',
      title: 'สำเร็จ',
      text: 'เข้าสู่ระบบสำเร็จ',
      timer: 1500,
      showConfirmButton: false
    })

    router.push('/')

    email.value = ''
    password.value = ''
    touched.value = { email: false, password: false }
    error.value = ''

  } catch (err: any) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    })
    console.error(err)
  }
}

const handleRegister = () => {
  showRegister.value = true
}

const handleBackToLogin = () => {
  showRegister.value = false
}

const handleIdNumberInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/[^0-9]/g, '').slice(0, 13)
  idNumber.value = input.value
}

const scanIdCard = async () => {
  try {
    // สร้าง input element สำหรับอัพโหลดรูป
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      Swal.fire({
        title: 'กำลังประมวลผล',
        text: 'กรุณารอสักครู่...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      try {
        const result = await Tesseract.recognize(file, 'tha+eng')
        const text = result.data.text

        const idMatch = text.match(/\d{13}/) || text.match(/เลขประจำตัวประชาชน\s*(\d{13})/) || text.match(/Identification Number\s*(\d{13})/)
        const nameMatch = text.match(/Name\s*([^\n]+)/)
        const lastNameMatch = text.match(/Last\s*name\s*([^\n]+)/)
        console.log(idMatch)
        if (idMatch) {
          idNumber.value = idMatch[0]
        }
        if (nameMatch) {
          firstName.value = nameMatch[1].trim()
        }
        if (lastNameMatch) {
          lastName.value = lastNameMatch[1].trim()
        }

        Swal.fire({
          icon: 'success',
          title: 'สแกนสำเร็จ',
          text: 'อัพเดทข้อมูลเรียบร้อยแล้ว'
        })
      } catch (err) {
        console.error(err)
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถสแกนบัตรได้ กรุณาลองใหม่อีกครั้ง'
        })
      }
    }

    input.click()
  } catch (err) {
    console.error(err)
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเปิดกล้องได้'
    })
  }
}

const SubmitRegister = async () => {
  if (!validateRegisterForm.value.isValid) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน'
    })
    return
  }

  try {
    const formData = {
      email: Registeremail.value,
      password: Registerpassword.value,
      firstName: firstName.value,
      lastName: lastName.value,
      idNumber: idNumber.value
    }

    const response = await authStore.register(formData)

    if (response?.status === 201) {
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'ลงทะเบียนสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      })
      resetForm()
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'เกิดข้อผิดพลาดในการลงทะเบียน'
    })
    error.value = 'เกิดข้อผิดพลาดในการลงทะเบียน'
    console.error(err)
  }
}

const resetForm = () => {
  showRegister.value = false
  error.value = ''
  Registeremail.value = ''
  Registerpassword.value = ''
  firstName.value = ''
  lastName.value = ''
  idNumber.value = ''
}

const validateRegisterForm = computed(() => {
  const errors = {
    email: !Registeremail.value ? 'กรุณากรอกอีเมล' :
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Registeremail.value) ? 'รูปแบบอีเมลไม่ถูกต้อง' : '',

    password: !Registerpassword.value ? 'กรุณากรอกรหัสผ่าน' :
      Registerpassword.value.length < 8 ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' :
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(Registerpassword.value) ?
          'รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข' : '',

    firstName: !firstName.value ? 'กรุณากรอกชื่อ' : '',
    lastName: !lastName.value ? 'กรุณากรอกนามสกุล' : '',
    idNumber: !idNumber.value ? 'กรุณากรอกเลขบัตรประชาชน' :
      !/^\d{13}$/.test(idNumber.value) ? 'เลขบัตรประชาชนต้องมี 13 หลัก' : ''
  }

  return {
    errors,
    isValid: !Object.values(errors).some(error => error !== '')
  }
})

const registerFormErrors = computed(() => validateRegisterForm.value.errors)
const isRegisterFormValid = computed(() => validateRegisterForm.value.isValid)
</script>

<template>
  <div class="login-container">
    <v-container fluid>
      <v-row justify="center" align="center" style="min-height: 100vh;">
        <v-col cols="12" md="8" lg="6">
          <v-card class="login-card" elevation="8">
            <v-row no-gutters>
              <!-- ส่วนซ้าย - รูปภาพ/โลโก้ -->
              <v-col cols="12" md="6" class="login-banner d-none d-md-flex">
                <div class="banner-content">
                  <v-carousel cycle hide-delimiters class="custom-carousel" height="400" style="padding-top: 20px;" show-arrows="hover">
  <v-carousel-item v-for="(slide, i) in [
    {
      title: 'ยินดีต้อนรับสู่แพลตฟอร์มของเรา',
      text: 'จัดการองค์กรของคุณอย่างมีประสิทธิภาพ',
      icon: 'mdi-home'
    },
    {
      title: 'ระบบจัดการบุคลากร',
      text: 'ดูแลและจัดการพนักงานได้อย่างเป็นระบบ',
      icon: 'mdi-account-group'
    },
    {
      title: 'แผนผังองค์กรแบบเรียลไทม์',
      text: 'ติดตามโครงสร้างองค์กรได้ทันที',
      icon: 'mdi-sitemap'
    }
  ]" :key="i" transition="fade-transition">
    <div class="banner-slide">
      <div class="slide-content">
        <h6 class="slide-subtitle">CDG</h6>
        <v-icon size="48" class="slide-icon mb-4">{{ slide.icon }}</v-icon>
        <h2 class="banner-title slide-title">{{ slide.title }}</h2>
        <p class="banner-text slide-description">{{ slide.text }}</p>
      </div>
    </div>
  </v-carousel-item>
</v-carousel>



                </div>
              </v-col>


              <!-- ส่วนขวา - ฟอร์มล็อกอิน -->
              <v-col cols="12" md="6">
                <div class="form-container pa-8">
                  <transition name="fade-slide" mode="out-in">
                    <!-- Login Form -->
                    <div v-if="!showRegister" key="login" class="form-wrapper">
                      <h3 class="text-h4 font-weight-bold mb-6">Welcome Back <span class="waving-hand">👋</span></h3>
                      <v-form @submit.prevent="handleLogin">
                        <v-text-field v-model="email" rounded="pill" label="Email" :error-messages="emailError"
                          @blur="touched.email = true" variant="outlined" prepend-inner-icon="mdi-email"
                          class="rounded-lg"></v-text-field>

                        <v-text-field v-model="password" rounded="pill" label="Password" type="password"
                          :error-messages="passwordError" @blur="touched.password = true" variant="outlined"
                          prepend-inner-icon="mdi-lock" class="mt-4"></v-text-field>

                        <v-btn block size="large" type="submit" :disabled="!isFormValid" class="mt-6" rounded="pill"
                          :style="{
                            background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                            color: '#fff',
                          }">
                          Sign In
                        </v-btn>
                      </v-form>

                      <div class="text-center mt-6">
                        <v-btn variant="text" @click="handleRegister" class="text-none">
                          Don't have an account? Sign Up
                        </v-btn>
                      </div>
                    </div>

                    <!-- Register Form -->
                    <div v-else key="register" class="form-wrapper">
                      <div class="signup-header mb-6">
                        <h3 class="text-h4 font-weight-bold">Create Account</h3>
                        <p class="text-subtitle-1 text-medium-emphasis">Please fill in the form to continue</p>
                      </div>

                      <v-form @submit.prevent="SubmitRegister">
                        <v-row>
                          <v-col cols="6">
                            <v-text-field
                              v-model="firstName"
                              label="First Name"
                              :error-messages="registerFormErrors.firstName"
                              variant="outlined"
                              rounded="pill"
                              prepend-inner-icon="mdi-account"
                              placeholder="John"
                              class="input-field"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              v-model="lastName"
                              label="Last Name"
                              :error-messages="registerFormErrors.lastName"
                              variant="outlined"
                              rounded="pill"
                              prepend-inner-icon="mdi-account"
                              placeholder="Doe"
                              class="input-field"
                            ></v-text-field>
                          </v-col>
                        </v-row>

                        <v-text-field
                          v-model="Registeremail"
                          label="Email"
                          :error-messages="registerFormErrors.email"
                          variant="outlined"
                          rounded="pill"
                          prepend-inner-icon="mdi-email"
                          placeholder="example@email.com"
                          class="input-field"
                        ></v-text-field>

                        <v-text-field
                          v-model="Registerpassword"
                          label="Password"
                          type="password"
                          :error-messages="registerFormErrors.password"
                          variant="outlined"
                          rounded="pill"
                          prepend-inner-icon="mdi-lock"
                          placeholder="Enter your password"
                          class="input-field"
                          persistent-hint
                          hint="Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
                        ></v-text-field>

                        <div class="id-card-section">
                          <v-text-field
                            v-model="idNumber"
                            label="ID Number"
                            :error-messages="registerFormErrors.idNumber"
                            @input="handleIdNumberInput"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-card-account-details"
                            placeholder="1234567890123"
                            class="input-field"
                          >
                            <template v-slot:append>
                              <v-tooltip location="top" text="Scan ID Card">
                                <template v-slot:activator="{ props }">
                                  <v-btn
                                    v-bind="props"
                                    icon
                                    color="primary"
                                    variant="text"
                                    @click="scanIdCard"
                                    class="scan-button"
                                  >
                                    <v-icon>mdi-credit-card-scan</v-icon>
                                  </v-btn>
                                </template>
                              </v-tooltip>
                            </template>
                          </v-text-field>
                        </div>

                        <v-btn
                          block
                          size="large"
                          type="submit"
                          :disabled="!isRegisterFormValid"
                          class="mt-6 signup-button"
                          rounded="pill"
                          :style="{
                            background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                            color: '#fff',
                          }"
                        >
                          <v-icon left class="mr-2">mdi-account-plus</v-icon>
                          Create Account
                        </v-btn>
                      </v-form>

                      <div class="text-center mt-6">
                        <v-btn
                          variant="text"
                          @click="handleBackToLogin"
                          class="back-button"
                          prepend-icon="mdi-arrow-left"
                        >
                          Back to Sign In
                        </v-btn>
                      </div>
                    </div>
                  </transition>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.custom-carousel {
  padding-top: 20px;
  background: transparent;
}

.banner-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.slide-content {
  opacity: 0;
  transform: translateY(20px);
  animation: slideIn 0.5s ease forwards;
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-subtitle {
  font-size: 1.2rem;
  color: #2196f3;
  margin-bottom: 1rem;
}

.slide-icon {
  color: #2196f3;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.slide-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #333;
}

.slide-description {
  font-size: 1.1rem;
  color: #666;
}

.waving-hand {
  display: inline-block;
  animation: wave 2s infinite;
  transform-origin: 70% 70%;
}

@keyframes wave {
  0% {
    transform: rotate(0deg);
  }

  10% {
    transform: rotate(14deg);
  }

  20% {
    transform: rotate(-8deg);
  }

  30% {
    transform: rotate(14deg);
  }

  40% {
    transform: rotate(-4deg);
  }

  50% {
    transform: rotate(10deg);
  }

  60% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.login-container {
  min-height: 100vh;
  background: url('/nyc-aerial-view-new-york-city-night.jpg') no-repeat center center fixed;
  background-size: cover;
}

.login-card {
  border-radius: 16px;
  overflow: hidden;
}

.login-banner {
  background: linear-gradient(135deg, #fefefe 0%, #2196f3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: rgb(0, 0, 0);
}

.banner-content {
  display: flex;

}


.logo {
  width: 120px;
  height: auto;
  margin-bottom: 2rem;
}

.banner-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.banner-text {
  font-size: 1.1rem;
  opacity: 0.9;
}

.form-container {
  max-width: 400px;
  margin: 0 auto;
}

.v-text-field {
  margin-bottom: 1rem;
}

@media (max-width: 959px) {
  .login-card {
    margin: 1rem;
  }
}

.signup-header {
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.input-field {
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.input-field:hover {
  transform: translateY(-1px);
}

.id-card-section {
  position: relative;
  margin-bottom: 1rem;
}

.scan-button {
  transition: transform 0.2s ease;
}

.scan-button:hover {
  transform: scale(1.1);
}

.signup-button {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.signup-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.signup-button:hover::before {
  left: 100%;
}

.back-button {
  transition: all 0.3s ease;
}

.back-button:hover {
  transform: translateX(-5px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation for form transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* เพิ่ม perspective เพื่อให้เกิด 3D effect */
.form-container {
  perspective: 1000px;
}

.form-wrapper {
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

/* ปรับแต่ง animation ให้ดูนุ่มนวลขึ้น */
@keyframes formEnter {
  from {
    opacity: 0;
    transform: translateX(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes formLeave {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-30px) scale(0.95);
  }
}

/* เพิ่ม animation สำหรับ input fields */
.input-field {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
}

.input-field:nth-child(1) { animation-delay: 0.1s; }
.input-field:nth-child(2) { animation-delay: 0.2s; }
.input-field:nth-child(3) { animation-delay: 0.3s; }
.input-field:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* เพิ่ม animation สำหรับปุ่ม */
.v-btn {
  animation: buttonFadeIn 0.5s ease forwards;
  animation-delay: 0.5s;
  opacity: 0;
}

@keyframes buttonFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ปรับแต่ง transition ของ form container */
.form-container {
  transition: transform 0.5s ease;
}

.form-container:hover {
  transform: translateY(-5px);
}

/* เพิ่ม animation สำหรับ error messages */
.v-text-field--error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>
