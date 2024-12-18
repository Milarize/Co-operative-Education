<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useReportStore } from '../data/stores/report'
import ApexCharts from 'apexcharts'

interface ChartOptions {
  series: Array<{
    name: string
    data: number[]
  }>
  chart: {
    height: number
    type: string
    zoom: {
      enabled: boolean
    }
  }
  dataLabels: {
    enabled: boolean
  }
  stroke: {
    curve: string
  }
  title: {
    text: string
    align: string
  }
  grid: {
    row: {
      colors: string[]
      opacity: number
    }
  }
  xaxis: {
    categories: string[]
  }
}

const reportStore = useReportStore()
const chartInstance = ref<ApexCharts | null>(null)

onMounted(async () => {
  if (!reportStore.selectedUser?.id) return
  
  await reportStore.fetchUserReport(reportStore.selectedUser.id)

  const options: ChartOptions = {
    series: [{
      name: "การเข้าใช้งาน",
      data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
    }],
    chart: {
      height: 350,
      type: 'line',
      zoom: { enabled: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight' },
    title: {
      text: 'สถิติการใช้งานรายเดือน',
      align: 'left'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.']
    }
  }

  const chartElement = document.querySelector("#chart")
  if (chartElement) {
    const chart = new ApexCharts(chartElement, options)
    chart.render()
    chartInstance.value = chart
  }
})

const closeDialog = () => {
  reportStore.dialog = false
}

onBeforeUnmount(() => {
  chartInstance.value?.destroy()
})
</script>

<template>
  <div class="dialog-report">
    <v-dialog v-model="reportStore.dialog" max-width="800px">
      <v-card class="rounded-lg">
        <v-card-title 
          class="d-flex align-center" 
          :style="{
            background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
            color: '#fff'
          }"
        >
          <v-col cols="8" class="text-h5 font-weight-medium">
            รายงานการใช้งาน
          </v-col>
          <v-col cols="4" class="text-right">
            <v-btn color="white" variant="text" @click="closeDialog">
              <v-icon>mdi-close</v-icon>
              ปิด
            </v-btn>
          </v-col>
        </v-card-title>

        <v-card-text class="mt-6">
          <v-container>
            <v-row>
              <v-col cols="12" md="4" class="banner-section">
                <div class="banner-content">
                  <p>ข้อมูลเกี่ยวกับรายงานการใช้งาน</p>
                  <p v-if="reportStore.selectedUser">
                    {{ reportStore.selectedUser.firstName }} 
                    {{ reportStore.selectedUser.lastName }}
                  </p>
                </div>
              </v-col>
              
              <v-col cols="12" md="8">
                <div class="report-content">
                  <div v-if="reportStore.loading" class="loading-container">
                    <v-progress-circular indeterminate color="primary" />
                    <span class="ml-3">กำลังโหลดข้อมูล...</span>
                  </div>

                  <div v-else-if="reportStore.error" class="error-container">
                    <v-icon color="error" size="48">mdi-alert-circle</v-icon>
                    <p class="text-error mt-2">{{ reportStore.error }}</p>
                  </div>

                  <div v-else class="report-details">
                    <div v-if="reportStore.userReport" class="user-stats mb-6">
                      <v-row>
                        <v-col v-for="(report, index) in reportStore.userReport" :key="index" cols="12">
                          <v-card class="stat-card pa-4" elevation="2">
                            <div class="d-flex align-center mb-2">
                              <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
                              <span class="text-subtitle-1">เข้าสู่ระบบล่าสุด</span>
                            </div>
                            <p class="text-h6">
                              {{ new Date(report.lastLogin).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) }}
                            </p>
                            <div class="d-flex align-center mt-4">
                              <v-icon color="primary" class="mr-2">mdi-login</v-icon>
                              <span class="text-h5 font-weight-bold">{{ report.loginCount }}</span>
                              <span class="text-subtitle-1 ml-2">ครั้ง</span>
                            </div>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>

                    <div id="chart" class="chart-container" />
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.dialog-report {
  margin: 0;
}

.banner-section {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.banner-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.report-content {
  animation: fadeInUp 0.5s ease forwards;
}

.chart-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
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

:deep(.v-card) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

:deep(.v-card-title) {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
}
</style>

