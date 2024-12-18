<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from "../data/stores/auth"
import Swal from 'sweetalert2'
import { useTheme } from 'vuetify'

const showPassword = ref(false)
const authStore = useAuthStore()
const currentStep = ref('1')

const formData = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '', 
  idNumber: ''
})

const touched = ref({
  email: false,
  password: false,
  confirmPassword: false,
  firstName: false,
  lastName: false,
  idNumber: false
})

const errors = computed(() => {
  return {
    email: !formData.value.email ? 'กรุณากรอกอีเมล' : 
           !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email) ? 'รูปแบบอีเมลไม่ถูกต้อง' : '',
           
    password: !formData.value.password ? 'กรุณากรอกรหัสผ่าน' :
             formData.value.password.length < 8 ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' :
             !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.value.password) ? 
             'รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข' : '',
             
    confirmPassword: !formData.value.confirmPassword ? 'กรุณายืนยันรหัสผ่าน' :
                    formData.value.password !== formData.value.confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : '',
                    
    firstName: !formData.value.firstName ? 'กรุณากรอกชื่อ' : '',
    lastName: !formData.value.lastName ? 'กรุณากรอกนามสกุล' : '',
    idNumber: !formData.value.idNumber ? 'กรุณากรอกเลขบัตรประชาชน' :
              !/^\d{13}$/.test(formData.value.idNumber) ? 'เลขบัตรประชาชนต้องมี 13 หลัก' : ''
  }
})


const isStepValid = computed(() => {
  if (currentStep.value === '1') {
    return !errors.value.email && formData.value.email
  } else if (currentStep.value === '2') {
    return !errors.value.password && !errors.value.confirmPassword && 
           formData.value.password && formData.value.confirmPassword
  } else {
    return !errors.value.firstName && !errors.value.lastName && !errors.value.idNumber &&
           formData.value.firstName && formData.value.lastName && formData.value.idNumber
  }
})

const nextStep = () => {
  if (Number(currentStep.value) < 3 && isStepValid.value) {
    currentStep.value = String(Number(currentStep.value) + 1)
  }
}

const prevStep = () => {
  if (Number(currentStep.value) > 1) {
    currentStep.value = String(Number(currentStep.value) - 1)
  }
}

const theme = useTheme()

// เพิ่ม config สำหรับ Sweetalert2
const swalConfig = {
  customClass: {
    container: 'custom-swal-container',
    popup: 'custom-swal-popup',
    title: 'custom-swal-title',
    htmlContainer: 'custom-swal-html-container',
    icon: 'custom-swal-icon',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp animate__faster'
  },
  timer: 1500,
  timerProgressBar: true,
  showConfirmButton: false,
  background: 'rgba(255, 255, 255, 0.9)',
  color: theme.global.current.value.dark ? '#ffffff' : '#000000',
  backdrop: `rgba(0, 0, 123, 0.1) left top no-repeat`
}

// เพิ่มฟังก์ชันสำหรับแสดง alert
const showAlert = (type: 'success' | 'error' | 'warning', title: string, text?: string) => {
  Swal.fire({
    ...swalConfig,
    icon: type,
    title: title,
    text: text,
    background: theme.global.current.value.dark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'
  })
}

// แก้ไขฟังก์ชัน handleSubmit
const handleSubmit = async () => {
    try {
        await authStore.registerAdmin(formData.value)
        showAlert('success', 'ลงทะเบียนสำเร็จ')
    } catch (error) {
        showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง')
    }
}
</script>

<template>
  <div class="register-container">
    <v-container fluid>
      <v-row justify="center" align="center" style="min-height: 100vh;">
        <v-col cols="12" md="8" lg="6">
          <v-card class="register-card" elevation="8">
            <v-row no-gutters>
              <!-- ส่วนซ้าย - แบนเนอร์ -->
              <v-col cols="12" md="6" class="register-banner d-none d-md-flex">
                <div class="banner-content">
                  <v-carousel cycle hide-delimiters class="custom-carousel" height="400" show-arrows="hover">
                    <v-carousel-item v-for="(slide, i) in [
                      {
                        title: 'ลงทะเบียนผู้ดูแลระบบ',
                        text: 'เริ่มต้นจัดการระบบของคุณ',
                        icon: 'mdi-shield-account'
                      },
                      {
                        title: 'ระบบจัดการองค์กร',
                        text: 'ควบคุมดูแลระบบอย่างมีประสิทธิภาพ',
                        icon: 'mdi-domain'
                      },
                      {
                        title: 'ความปลอดภัยสูงสุด',
                        text: 'ระบบรักษาความปลอดภัยมาตรฐานสากล',
                        icon: 'mdi-security'
                      }
                    ]" :key="i">
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

              <!-- ส่วนขวา - ฟอร์มลงทะเบียน -->
              <v-col cols="12" md="6">
                <div class="form-container pa-8">
                  <div class="form-wrapper">
                    <div class="register-header mb-6">
                      <h3 class="text-h4 font-weight-bold"> Sign up</h3>
                      <p class="text-subtitle-1 text-medium-emphasis">เฉพาะผู้ดูแลระบบ</p>
                    </div>

                    <!-- แสดงขั้นตอนการลงทะเบียน -->
                    <div class="stepper mb-6">
                      <v-stepper v-model="currentStep" class="custom-stepper">
                        <v-stepper-header>
                          <v-stepper-item 
                            value="1" 
                            title=""
                            icon="mdi-email"
                            :complete="Number(currentStep) > 1"
                          ></v-stepper-item>
                          
                          <v-stepper-divider></v-stepper-divider>
                          
                          <v-stepper-item 
                            value="2" 
                            title=""
                            icon="mdi-lock"
                            :complete="Number(currentStep) > 2"
                          ></v-stepper-item>
                          
                          <v-stepper-divider></v-stepper-divider>
                          
                          <v-stepper-item 
                            value="3" 
                            title=""
                            icon="mdi-account"
                          ></v-stepper-item>
                        </v-stepper-header>
                      </v-stepper>
                    </div>

                  
                    <!-- ฟอร์มลงทะเบียน -->
                    <v-form @submit.prevent="handleSubmit">
                      <!-- Step 1: ข้อมูลบัญชี -->
                      <v-window v-model="currentStep">
                        <v-window-item value="1">
                          <v-text-field
                            v-model="formData.email"
                            label="อีเมล"
                            :error-messages="touched.email && errors.email"
                            @blur="touched.email = true"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-email"
                          ></v-text-field>
                        </v-window-item>

                        <!-- Step 2: รหัสผ่าน -->
                        <v-window-item value="2">
                          <v-text-field
                            v-model="formData.password"
                            :type="showPassword ? 'text' : 'password'"
                            label="รหัสผ่าน"
                            :error-messages="touched.password && errors.password"
                            @blur="touched.password = true"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-lock"
                            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                            @click:append-inner="showPassword = !showPassword"
                          ></v-text-field>

                          <v-text-field
                            v-model="formData.confirmPassword"
                            type="password"
                            label="ยืนยันรหัสผ่าน"
                            :error-messages="touched.confirmPassword && errors.confirmPassword"
                            @blur="touched.confirmPassword = true"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-lock-check"
                          ></v-text-field>
                        </v-window-item>

                        <!-- Step 3: ข้อมูลส่วนตัว -->
                        <v-window-item value="3">
                          <v-text-field
                            v-model="formData.firstName"
                            label="ชื่อ"
                            :error-messages="touched.firstName && errors.firstName"
                            @blur="touched.firstName = true"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-account"
                          ></v-text-field>

                          <v-text-field
                            v-model="formData.lastName"
                            label="นามสกุล"
                            :error-messages="touched.lastName && errors.lastName"
                            @blur="touched.lastName = true"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-account"
                          ></v-text-field>

                          <v-text-field
                            v-model="formData.idNumber"
                            label="เลขบัตรประชาชน"
                            :error-messages="touched.idNumber && errors.idNumber"
                            @blur="touched.idNumber = true"
                            variant="outlined"
                            rounded="pill"
                            prepend-inner-icon="mdi-card-account-details"
                            maxlength="13"
                          ></v-text-field>
                        </v-window-item>
                      </v-window>

                      <!-- ปุ่มดำเนินการ -->
                      <div class="d-flex justify-space-between mt-6">
                        <v-btn
                          v-if="currentStep > 1"
                          variant="outlined"
                          rounded="pill"
                          @click="prevStep"
                          prepend-icon="mdi-arrow-left"
                        >
                          ย้อนกลับ
                        </v-btn>
                        <v-spacer v-if="currentStep === '1'"></v-spacer>
                        <v-btn
                          v-if="currentStep < '3'"
                          :disabled="!isStepValid"
                          rounded="pill"
                          @click="nextStep"
                          append-icon="mdi-arrow-right"
                          :style="{
                            background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                            color: '#fff',
                          }"
                        >
                          ถัดไป
                        </v-btn>
                        <v-btn
                          v-else
                          type="submit"
                          :disabled="!isStepValid"
                          rounded="pill"
                          :style="{
                            background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                            color: '#fff',
                          }"
                        >
                          ลงทะเบียน
                        </v-btn>
                      </div>
                    </v-form>
                  </div>
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
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
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

.register-container {
  min-height: 100vh;
  background: url('/nyc-aerial-view-new-york-city-night.jpg') no-repeat center center fixed;
  background-size: cover;
}

.register-card {
  border-radius: 16px;
  overflow: hidden;
}

.register-banner {
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

.form-container {
  max-width: 400px;
  margin: 0 auto;
  perspective: 1000px;
}

.form-wrapper {
  backface-visibility: hidden;
  transform-style: preserve-3d;
  animation: formEnter 0.5s ease forwards;
}

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

.v-text-field {
  margin-bottom: 1rem;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
}

.v-text-field:nth-child(1) { animation-delay: 0.1s; }
.v-text-field:nth-child(2) { animation-delay: 0.2s; }
.v-text-field:nth-child(3) { animation-delay: 0.3s; }

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

.v-btn {
  animation: buttonFadeIn 0.5s ease forwards;
  animation-delay: 0.5s;
  opacity: 0;
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
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

.form-container {
  transition: transform 0.5s ease;
}

.form-container:hover {
  transform: translateY(-5px);
}

.v-text-field--error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Stepper Customization */
.stepper {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  animation-delay: 0.3s;
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

/* Window Transition */
.v-window-item {
  transition: all 0.3s ease;
}

.v-window-item--active {
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 959px) {
  .register-card {
    margin: 1rem;
  }
}

/* เพิ่ม styles ใหม่ */
.custom-stepper {
  background: transparent !important;
  box-shadow: none !important;
}

.custom-stepper :deep(.v-stepper-header) {
  box-shadow: none !important;
  background: transparent !important;
  border: none !important;
}

.custom-stepper :deep(.v-stepper-item__avatar) {
  background: #e0e0e0 !important;
}

.custom-stepper :deep(.v-stepper-item--active) .v-stepper-item__avatar {
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%) !important;
}

.custom-stepper :deep(.v-stepper-item--complete) .v-stepper-item__avatar {
  background: #2196f3 !important;
}

/* Sweetalert2 Styles */
.custom-swal-container {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.custom-swal-popup {
  border-radius: 24px !important;
  padding: 1.5rem !important;
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37) !important;
}

html[data-theme="dark"] .custom-swal-popup {
  background: rgba(30, 30, 30, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.custom-swal-title {
  font-size: 1.5rem !important;
  font-weight: 600 !important;
  color: inherit !important;
  padding: 1rem 0 !important;
}

.custom-swal-icon {
  border: none !important;
  margin: 1.5rem auto !important;
}

.swal2-success {
  border: none !important;
}

.swal2-success-circular-line-left,
.swal2-success-circular-line-right,
.swal2-success-fix {
  background: transparent !important;
}

.swal2-warning {
  color: #FFC107 !important;
}

.swal2-timer-progress-bar {
  background: linear-gradient(to right, #2196f3, #4CAF50) !important;
  height: 0.25rem !important;
  opacity: 0.6 !important;
}

.dark-theme .custom-swal-popup {
  background: linear-gradient(145deg, #1E1E1E 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

@keyframes swalIconScale {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.swal2-icon {
  animation: swalIconScale 0.3s ease forwards !important;
}

.custom-swal-popup:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s ease !important;
}

.swal2-icon-content {
  font-size: 2.5rem !important;
  font-weight: 600 !important;
}

.custom-swal-title, .custom-swal-html-container {
  animation: fadeInUp 0.3s ease forwards !important;
}
</style>


