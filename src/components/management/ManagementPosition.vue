<template>
  <AddPosition />
  <EditPosition />
  <div class="position-container">
    <v-container fluid>
      <h1 class="text-h4 font-weight-bold mb-6">จัดการตำแหน่ง</h1>

      <div class="filter-container mb-4 d-flex justify-between">
        <v-text-field
          v-model="searchQuery"
          placeholder="ค้นหาตำแหน่ง..."
          variant="outlined"
          rounded="pill"
          
          prepend-inner-icon="mdi-magnify"
          class="search-input"
          hide-details
        ></v-text-field>
        <v-btn 
          color="primary"
          variant="flat"
          class="mb-4 ml-4"
          rounded="pill"
          @click="positionStore.showAddDialog = true"
          style="background: linear-gradient(135deg, #000000 0%, #2196f3 100%); color: white;"
        >
          เพิ่มตำแหน่ง
        </v-btn>
      </div>

      <div class="table-container">
        <v-table class="user-table">
          <thead>
            <tr>
              <th>ชื่อตำแหน่ง</th>
              <th>รายละเอียด</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="position in filteredPositions" :key="position.id">
              <td>{{ position.name }}</td>
              <td>{{ position.description }}</td>
              <td>
                <v-btn v-if="!position.deletedAt" @click="handleDelete(position.id)" icon color="error">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn v-if="position.deletedAt" icon color="info" v-tooltip="position.deletedAt ? `ปิดใช้งาน: ${new Date(position.deletedAt).toLocaleString('th-TH')}` : ''">
                  <v-icon>mdi-information</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div class="pagination mt-4">
          <v-btn
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
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
            @click="handlePageChange(currentPage + 1)"
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

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { usePositionStore } from '../../data/stores/position'
import AddPosition from './AddPosition.vue'
import Swal from 'sweetalert2'

const positionStore = usePositionStore()
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(5)


const handleDelete = async (id: number) => {
  try {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบตำแหน่งนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      await positionStore.deletePosition(id)
      await positionStore.getAllPositions()
      
      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'ลบตำแหน่งงานเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      })
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error)
    await Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'ไม่สามารถลบตำแหน่งงานได้',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

const filteredPositions = computed(() => {
  let filtered = positionStore.positions
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(position => 
      position.name?.toLowerCase().includes(query) ||
      position.description?.toLowerCase().includes(query)
    )
  }

  const start = (currentPage.value - 1) * itemsPerPage.value
  return filtered.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => 
  Math.ceil(positionStore.positions.length / itemsPerPage.value)
)

const handlePageChange = (page: number) => {
  currentPage.value = page
}

onMounted(async () => {
  await positionStore.getAllPositions()
})

</script>

<style scoped>
.position-container {
  padding: 2rem 0;
}

.filter-container {
  display: flex;
  gap: 1rem;
  max-width: 400px;
  animation: fadeInUp 0.5s ease forwards;
}

.search-input {
  flex: 1;
  transition: all 0.3s ease;
}

.search-input:hover {
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
