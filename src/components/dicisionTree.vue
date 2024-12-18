<template>
  <v-dialog v-model="showDialog" max-width="600px">
    <v-card v-if="selectedNode" class="rounded-lg">
      <v-card-title class="headline bg-primary text-white pa-4 d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon large color="white" class="mr-2">mdi-account</v-icon>
          <span>ข้อมูลพนักงาน</span>
        </div>
        <v-btn color="white" variant="text" @click="showDialog = false">
          <v-icon left>mdi-close</v-icon>
          ปิด
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="dialog-content">
          <v-row>
            <v-col cols="12">
              <v-card flat class="employee-info pa-4 rounded-lg">
                <div class="d-flex align-center mb-4">
                  <v-avatar color="primary" size="64" class="mr-4">
                    <span class="text-h5 white--text">{{ selectedNode.firstName[0] }}</span>
                  </v-avatar>
                  <div>
                    <h2 class="text-h5 mb-1">{{ selectedNode.firstName }} {{ selectedNode.lastName }}</h2>
                    <div class="d-flex align-center">
                      <p class="text-subtitle-1 grey--text mr-2">{{ selectedNode.email }}</p>
                      <v-btn icon small color="primary" :href="`mailto:${selectedNode.email}`">
                        <v-icon>mdi-email</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <div v-if="userStore.loading">กำลังโหลด...</div>
  <div v-else-if="userStore.error">{{ userStore.error }}</div>
  <div v-else>
    <!-- เพิ่มช่องค้นหา -->
    <div class="search-container">
      <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อพนักงาน..." class="search-input"
        @input="searchStructure" />

      <!-- เพิ่มตัวเลือกการแสดงผล -->
      <div class="display-options">
  <v-btn-toggle v-model="displayMode" mandatory class="styled-btn-toggle">
    <v-btn value="all" class="styled-btn">แสดงทั้งหมด</v-btn>
    <v-btn value="two-levels" class="styled-btn">แสดง 2 ระดับ</v-btn>
  </v-btn-toggle>
</div>
    </div>

    <div v-if="filteredData" class="container">
      <div class="tree">
        <div class="node">
          <div class="node-content" @click="handleNodeClick(filteredData)">
            <div class="user-info">
              <h3>{{ filteredData.firstName }} {{ filteredData.lastName }}</h3>
              <p>{{ filteredData.position }}</p>
            </div>
          </div>
          <template v-if="filteredData.subordinates && filteredData.subordinates.length">
            <div class="children">
              <div v-for="subordinate in filteredData.subordinates" :key="subordinate.id" class="node">
                <div class="node-content" @click="handleNodeClick(subordinate)">
                  <div class="user-info">
                    <h3>{{ subordinate.firstName }} {{ subordinate.lastName }}</h3>
                    <p>{{ subordinate.position }}</p>
                  </div>
                </div>
                <template
                  v-if="subordinate.subordinates && subordinate.subordinates.length && (displayMode === 'all' || searchQuery)">
                  <div class="children">
                    <div v-for="subSubordinate in subordinate.subordinates" :key="subSubordinate.id" class="node">
                      <div class="node-content" @click="handleNodeClick(subSubordinate)">
                        <div class="user-info">
                          <h3>{{ subSubordinate.firstName }} {{ subSubordinate.lastName }}</h3>
                          <p>{{ subSubordinate.position }}</p>
                        </div>
                      </div>
                      <template
                        v-if="subSubordinate.subordinates && subSubordinate.subordinates.length && (displayMode === 'all' || searchQuery)">
                        <div class="children">
                          <div v-for="subSubSubordinate in subSubordinate.subordinates" :key="subSubSubordinate.id"
                            class="node">
                            <div class="node-content" @click="handleNodeClick(subSubSubordinate)">
                              <div class="user-info">
                                <h3>{{ subSubSubordinate.firstName }} {{ subSubSubordinate.lastName }}</h3>
                                <p>{{ subSubSubordinate.position }}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div v-else>ไม่พบข้อมูลโครงสร้างองค์กร</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../data/stores/user'

const userStore = useUserStore()
const currentUser = computed(() => JSON.parse(localStorage.getItem('user') || '{}').user)
const structureData = ref<any>(null)
const filteredData = ref<any>(null)
const searchQuery = ref('')
const displayMode = ref('all') // เพิ่มตัวแปรควบคุมการแสดงผล
const showDialog = ref(false)
const selectedNode = ref<any>(null)

const handleNodeClick = (node: any) => {
  selectedNode.value = node
  showDialog.value = true
}

const searchStructure = () => {
  if (!searchQuery.value) {
    filteredData.value = structureData.value
    return
  }

  const searchInNode = (node: any): any => {
    const fullName = `${node.firstName} ${node.lastName}`.toLowerCase()
    if (fullName.includes(searchQuery.value.toLowerCase())) {
      return node
    }
    if (node.subordinates) {
      for (const sub of node.subordinates) {
        const result = searchInNode(sub)
        if (result) return result
      }
    }
    return null
  }

  const result = searchInNode(structureData.value)
  filteredData.value = result
}

const renderNode = (node: any) => {
  return {
    name: `${node.firstName} ${node.lastName}`,
    title: node.position,
    children: node.subordinates?.map((sub: any) => renderNode(sub)) || []
  }
}

onMounted(async () => {
  await userStore.getStructureById(currentUser.value?.id)
  structureData.value = userStore.structureById?.data
  filteredData.value = structureData.value
})
</script>

<style scoped>
.search-container {
  margin: 20px;
  text-align: center;
}

.display-options {
  margin-top: 10px;
}

.search-input {
  padding: 12px 24px;
    width: 400px;
    border: 1px solid #ccc;
    border-radius: 50px;
    font-size: 16px;
    background: white;
    color: #000;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.org-tree {
  padding: 20px;
}
.styled-btn-toggle {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.styled-btn {
  background-color: #21557f57; /* สีพื้นหลัง */
  color: white; /* สีตัวอักษร */
  border-radius: 20px; /* มุมโค้ง */
  transition: background-color 0.3s ease; /* การเปลี่ยนสี */
}

.styled-btn:hover {
  background-color: #1976d2; /* สีเมื่อชี้เมาส์ */
}

.tree {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node {
  margin: 10px;
  text-align: center;
}

.node-content {
    border: none;
    padding: 16px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    animation: fadeInUp 0.5s ease forwards;
    border-left: 4px solid #2196f3;
}

.node-content:hover {
  background: #f5f5f5;
  transform: scale(1.02);
}

.name {
  font-weight: bold;
  margin-bottom: 5px;
}

.position {
  color: #666;
  font-size: 0.9em;
}

.role {
  color: #888;
  font-size: 0.8em;
}

.children {
  position: relative;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #ccc;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.children::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 20px;
}

.dialog-content {
  padding: 20px;
}

.employee-info {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.position-section {
  background-color: #fff;
  border: 1px solid #e9ecef;
  margin: 15px 0;
}

.management-position-user {
  margin-top: 20px;
}

.user-form {
  max-width: 100%;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.btn-assign {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.btn-assign:hover {
  background-color: #45a049;
}

.unrelated-nodes {
  padding: 20px;
  margin-bottom: 30px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.unrelated-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.unrelated-node {
  background-color: #fff;
  border: 2px dashed #ccc;
}
</style>