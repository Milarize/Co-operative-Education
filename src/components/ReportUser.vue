<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../data/stores/user'
import Swal from 'sweetalert2'
import DialogReport from './dialogReport.vue'
import type { User } from '../data/types/user.type'
import { useReportStore } from '../data/stores/report'

const selectedUser = ref<User | null>(null)
const userStore = useUserStore()
const selectedRole = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5)
const accountStatus = ref('active')
const reportStore = useReportStore()

onMounted(() => {
  userStore.fetchUser()
})

const filteredUsers = computed(() => {
  let filtered = userStore.user

  if (accountStatus.value === 'active') {
    filtered = filtered.filter(user => !user.deletedAt)
  } else if (accountStatus.value === 'deleted') {
    filtered = filtered.filter(user => user.deletedAt)
  }

  if (selectedRole.value !== 'all') {
    filtered = filtered.filter(user => user.role === selectedRole.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.idNumber?.includes(query)
    )
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredUsers.value.slice(start, start + itemsPerPage.value)
})

const handlePageChange = (page: number) => {

  currentPage.value = page
}

const handleDelete = async (id: number, event: Event) => {
  event.stopPropagation()
  
  try {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      await userStore.deleteUser(id)
      await userStore.fetchUser()
      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'ลบผู้ใช้งานสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      })
    }
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถลบผู้ใช้งานได้ กรุณาลองอีกครั้ง'
    })
    console.error('เกิดข้อผิดพลาดในการลบผู้ใช้:', error)
  }
}
const openDialog = (user: User) => {
  
  reportStore.selectedUser = user
  console.log('reportStore.selectedUser', reportStore.selectedUser)
  reportStore.dialog = true 
  console.log('reportStore.dialog', reportStore.dialog)
}

</script>

<template>
<DialogReport 
  v-if="reportStore.dialog"
  :user="selectedUser"
  @close="selectedUser = null" 
/>

  <div class="report-container">
    <v-container fluid>
      <h1 class="text-h4 font-weight-bold mb-6">จัดการผู้ใช้</h1>

      <div class="filter-container mb-4">
        <v-text-field
          v-model="searchQuery"
          placeholder="ค้นหาผู้ใช้..."
          variant="outlined"
          rounded="pill"
          prepend-inner-icon="mdi-magnify"
          class="search-input"
          hide-details
        ></v-text-field>
        <v-select
          v-model="selectedRole"
          :items="[
            { title: 'ทั้งหมด', value: 'all' },
            { title: 'พนักงาน', value: 'personnel' },
            { title: 'ผู้ดูแลระบบ', value: 'admin' }
          ]"
          item-title="title"
          item-value="value"
          variant="outlined"
          rounded="pill"
          class="role-filter"
          hide-details
        ></v-select>
        <v-select
          v-model="accountStatus"
          :items="[
            { title: 'บัญชีที่ใช้งาน', value: 'active' },
            { title: 'บัญชีที่ปิดแล้ว', value: 'deleted' },
            { title: 'ทั้งหมด', value: 'all' }
          ]"
          item-title="title"
          item-value="value"
          variant="outlined"
          rounded="pill"
          class="status-filter"
          hide-details
        ></v-select>
      </div>

      <div class="table-container">
        <v-table class="user-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>นามสกุล</th>
              <th>อีเมล</th>
              <th>เลขบัตรประชาชน</th>
              <th>สิทธิ์</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id" @click="() => openDialog(user)">

              <td>{{ user.firstName }}</td>
              <td>{{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.idNumber }}</td>
              <td>{{ user.role }}</td>
              <td>
                <span 
                  class="status-dot" 
                  :class="{ 'active': user.isActive, 'inactive': !user.isActive }"
                ></span>
              </td>
              <td>
                <v-btn v-if="!user.isActive && !user.deletedAt" @click="(event: Event) => handleDelete(user.id, event)" icon color="error">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn v-if="user.deletedAt" icon color="info" v-tooltip="user.deletedAt ? `ปิดใ: ${new Date(user.deletedAt).toLocaleString('th-TH')}` : ''">
                  <v-icon>mdi-information</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div class="pagination mt-4">
          <v-btn
            :disabled="currentPage === 1"
            @click="() => handlePageChange(currentPage - 1)"
            variant="outlined"
            rounded="pill"
            class="pagination-btn"
          >
            <v-icon>mdi-chevron-left</v-icon>
            ก่อนหน้า
          </v-btn>
          <span class="pagination-info">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
          <v-btn
            :disabled="currentPage === totalPages"
            @click="() => handlePageChange(currentPage + 1)"
            variant="outlined"
            rounded="pill"
            class="pagination-btn"
          >
            ถัดไป
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>
    </v-container>
  </div>
</template>

<style scoped>
.report-container {
  padding: 2rem 0;
}

.filter-container {
  display: flex;
  gap: 1rem;
  max-width: 1200px;
  animation: fadeInUp 0.5s ease forwards;
}

.search-input {
  flex: 2;
  transition: all 0.3s ease;
}

.role-filter, .status-filter {
  flex: 1;
  transition: all 0.3s ease;
}

.search-input:hover, .role-filter:hover, .status-filter:hover {
  transform: translateY(-2px);
}

.user-table {
  border-radius: 8px;
  overflow: hidden;
  animation: fadeIn 0.5s ease forwards;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  animation: fadeInUp 0.5s ease forwards;
}

.pagination-btn {
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #000000 0%, #2196f3 100%);
  color: white;
}

/* Status dot styles */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  transition: all 0.3s ease;
}

.status-dot.active {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.status-dot.inactive {
  background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
}

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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
