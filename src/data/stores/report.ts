import { defineStore } from 'pinia'
import reportService from '../services/report'
import { ref } from 'vue'
import type { User } from '../types/user.type'

interface UserReport {
  userId: number
  firstLogin: string 
  lastLogin: string
  loginCount: string
}

interface TodayReport {
  logId: number
  userId: number
  loginTime: string
  logoutTime: string | null
  createdAt: string
  updatedAt: string
}
const dialog = ref(false)
const showReportDialog = ref(false)
const userReport = ref<UserReport | null>(null)
const todayReport = ref<TodayReport[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedUser = ref<User | null>(null)
export const useReportStore = defineStore('report', () => {
  const fetchUserReport = async (userId: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await reportService.getUserReport(userId)
      userReport.value = response.data
      console.log('userReport', userReport.value)
    } catch (err) {
      error.value = 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน'
      console.error('Error fetching user report:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchTodayReport = async (userId: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await reportService.getTodayReport(userId)
      todayReport.value = response.data
      console.log('todayReport', todayReport.value)
    } catch (err) {
      error.value = 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานวันนี้'
      console.error('Error fetching today report:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    showReportDialog,
    dialog,
    userReport,
    todayReport,
    loading,
    error,
    fetchUserReport,
    fetchTodayReport,
    selectedUser
    
  }
})
