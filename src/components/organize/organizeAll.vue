<script setup lang="ts">
import { useUserStore } from '../../data/stores/user'
import { usePositionStore } from '../../data/stores/position'
import { onMounted, ref, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'
import OrgTreeNode from './OrgTreeNode.vue'

const theme = useTheme()
const userStore = useUserStore()
const positionStore = usePositionStore()
const searchQuery = ref('')
const filteredStructure = ref<any>(null)
const selectedNode = ref<any>(null)
const showDialog = ref(false)
const selectedLeaderId = ref('')
const selectedSubordinateId = ref('')
const selectedPosition = ref<number>()
const unrelatedNodes = ref<any[]>([])
const showUnrelatedNodes = ref(true)
const draggedNode = ref<any>(null)

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
  background: 'rgba(255, 255, 255, 0.9)', // ปรับความโปร่งใสของพื้นหลัง
  color: theme.global.current.value.dark ? '#ffffff' : '#000000',
  backdrop: `
    rgba(0, 0, 123, 0.1)
    left top
    no-repeat
  `
}

const showAlert = (type: 'success' | 'error' | 'warning', title: string, text?: string) => {
  Swal.fire({
    ...swalConfig,
    icon: type,
    title: title,
    text: text,
    background: theme.global.current.value.dark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'
  })
}

watch([selectedNode], () => {
    selectedSubordinateId.value = selectedNode.value?.id
    selectedLeaderId.value = selectedNode.value?.leaderId
})

const renderNode = (node: any) => {
    return {
        name: `${node.firstName} ${node.lastName}`,
        title: node.position,
        children: node.subordinates?.map((sub: any) => renderNode(sub)) || []
    }
}

const handleNodeClick = async (node: any) => {
    selectedNode.value = node
    selectedPosition.value = node.positionId
    selectedSubordinateId.value = node.id
    selectedLeaderId.value = node.leaderId
    showDialog.value = true
    await positionStore.getAllPositions()
}

const updatePosition = async () => {
    try {
        if (!selectedPosition.value) {
            showDialog.value = false
            showAlert('warning', 'กรุณาเลือกตำแหน่ง')
            return
        }

        await userStore.updateUserPosition(selectedNode.value.id, selectedPosition.value)
        showDialog.value = false
        showAlert('success', 'อัพเดทตำแหน่งสำเร็จ')
        
        await userStore.getStructure()
        filteredStructure.value = filterRootNodes(userStore.structure?.data)
        findUnrelatedNodes()

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error)
        showDialog.value = false
        showAlert('error', 'ไม่สามารถอัพเดทตำแหน่งได้', 'กรุณาลองใหม่อีกครั้ง')
    }
}

const updateLeader = async () => {
    try {
        await userStore.assignSubordinate(Number(selectedLeaderId.value), Number(selectedSubordinateId.value))

        showDialog.value = false
        showAlert('success', 'อัพเดทหัวหน้าสำเร็จ')

        await userStore.getStructure()
        filteredStructure.value = filterRootNodes(userStore.structure?.data)
        findUnrelatedNodes()

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error)
        showDialog.value = false
        showAlert('error', 'ไม่สามารถอัพเดทหัวหน้าได้', 'กรุณาลองใหม่อีกครั้ง')
    }
}

const findUnrelatedNodes = () => {
    if (!userStore.structure?.data) return

    const allNodes = new Set()
    const relatedNodes = new Set()

    // เก็บ ID ของทุก node
    const collectAllNodes = (node: any) => {
        if (!node.deletedAt) {
            allNodes.add(node.id)
        }
        if (node.subordinates) {
            node.subordinates.forEach((sub: any) => {
                if (!sub.deletedAt) {
                    relatedNodes.add(sub.id)
                    collectAllNodes(sub)
                }
            })
        }
    }

    Object.values(userStore.structure.data).forEach((node: any) => {
        if (!node.deletedAt) {
            collectAllNodes(node)
            if (node.leaderId) {
                relatedNodes.add(node.id)
            }
        }
    })

    // หา node ที่ไม่มีความสัมพันธ์
    unrelatedNodes.value = Array.from(allNodes)
        .filter(id => !relatedNodes.has(id))
        .map(id => {
            return Object.values(userStore.structure.data).find((node: any) => node.id === id)
        })
        .filter(Boolean)
}

const filterRootNodes = (nodes: any) => {
    if (!nodes) return null
    return Object.values(nodes).filter((node: any) => {
        return node.subordinates && node.subordinates.length > 0
    })
}

const searchStructure = () => {
    if (!searchQuery.value || !userStore.structure?.data) {
        filteredStructure.value = filterRootNodes(userStore.structure?.data)
        findUnrelatedNodes()
        return
    }

    const searchInNode = (node: any): any => {
        const fullName = `${node.firstName} ${node.lastName}`.toLowerCase()
        if (fullName.includes(searchQuery.value.toLowerCase())) {
            return node
        }
        if (node.subordinates) {
            const matchingSubordinates = node.subordinates
                .map(searchInNode)
                .filter((n: any) => n !== null)
            if (matchingSubordinates.length > 0) {
                return { ...node, subordinates: matchingSubordinates }
            }
        }
        return null
    }

    const searchResults = Object.values(userStore.structure.data)
        .map(searchInNode)
        .filter((node: any) => node !== null)
    
    filteredStructure.value = filterRootNodes(searchResults)
}

const getAllSubordinates = (node: any): Set<string> => {
    const subordinates = new Set<string>()
    if (!node?.subordinates) return subordinates

    node.subordinates.forEach((sub: any) => {
        subordinates.add(sub.id)
        const subSubordinates = getAllSubordinates(sub)
        subSubordinates.forEach(id => subordinates.add(id))
    })
    return subordinates
}

const filteredPersonnel = computed(() => {
    if (!selectedNode.value || !userStore.personnel) return []

    const subordinateIds = getAllSubordinates(selectedNode.value)
    const filtered = userStore.personnel.filter(person =>
        person.id !== selectedNode.value.id &&
        !subordinateIds.has(person.id)
    )

    return [{ id: null, firstName: '', lastName: '' }, ...filtered]
})

const handleDragStart = (node: any, event: DragEvent) => {
    draggedNode.value = node
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', node.id)
    }
}

const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
    }
}

const handleDrop = async (targetNode: any, event: DragEvent) => {
    event.preventDefault()
    if (!draggedNode.value || targetNode.id === draggedNode.value.id) return

    try {
        // อัพเดทหัวหน้าของ node ที่ลาก
        await userStore.assignSubordinate(targetNode.id, draggedNode.value.id)
        showAlert('success', 'อัพเดทหัวหน้าสำเร็จ')
        
        // รีเฟรชข้อมูล
        await userStore.getStructure()
        filteredStructure.value = filterRootNodes(userStore.structure?.data)
        findUnrelatedNodes()
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error)
        showAlert('error', 'ไม่สามารถอัพเดทหัวหน้าได้', 'กรุณาลองใหม่อีกครั้ง')
    }
}

const handleStructureUpdate = async () => {
  await userStore.getStructure()
  filteredStructure.value = filterRootNodes(userStore.structure?.data)
  findUnrelatedNodes()
}

watch(
  () => userStore.structure,
  async () => {
    filteredStructure.value = filterRootNodes(userStore.structure?.data)
    findUnrelatedNodes()
  },
  { deep: true }
)

onMounted(async () => {
    await userStore.getStructure()
    filteredStructure.value = filterRootNodes(userStore.structure?.data)
    await userStore.getUserPersonnel()
    findUnrelatedNodes()
})
</script>

<template>
    <div class="search-container">
        <input v-model="searchQuery" @input="searchStructure" type="text" placeholder="ค้นหาชื่อพนักงาน..."
            class="search-input" :class="{ 'dark': theme.global.current.value.dark }" />
    </div>

    <!-- Dialog -->
    <v-dialog v-model="showDialog" max-width="600px" transition="dialog-transition" class="custom-dialog">
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
                                        <h2 class="text-h5 mb-1">{{ selectedNode.firstName }} {{ selectedNode.lastName
                                            }}</h2>
                                        <p class="text-subtitle-1 grey--text">{{ selectedNode.email }}</p>
                                    </div>
                                </div>

                                <v-divider class="my-4"></v-divider>

                                <div class="position-section rounded-lg pa-4">
                                    <h3 class="text-h6 mb-3">จัดการตำแหน่ง</h3>
                                    <v-select v-model="selectedPosition" :items="positionStore.positions"
                                        item-title="name" item-value="id" label="เลือกตำแหน่ง" variant="outlined"
                                        density="comfortable" class="mb-4"></v-select>
                                    <v-btn color="primary" block @click="updatePosition" :elevation="2">
                                        <v-icon left>mdi-content-save</v-icon>
                                        อัพเดทตำแหน่ง
                                    </v-btn>
                                </div>

                                <v-divider class="my-4"></v-divider>
                                <div class="management-position-user rounded-lg pa-4">
                                    <h3 class="text-h6 mb-4">จัดการหัวหน้า</h3>

                                    <v-select v-model="selectedLeaderId" :items="filteredPersonnel"
                                        :item-title="item => item.id === null ? 'ไม่มีหัวหน้า' : `${item.firstName} ${item.lastName}`"
                                        item-value="id" label="เลือกหัวหน้า"
                                        @update:model-value="selectedLeaderId = $event" variant="outlined"
                                        density="comfortable" class="mb-4"></v-select>

                                    <v-btn color="success" block @click="updateLeader" :elevation="2">
                                        <v-icon left>mdi-account-multiple-plus</v-icon>
                                        อัพเดทหัวหน้า
                                    </v-btn>

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
        <!-- แสดงพนักงานทีไม่มีความสัมพันธ์ -->
        <div class="unrelated-section">
            <div class="section-header" 
                 @click="showUnrelatedNodes = !showUnrelatedNodes"
                 :class="{ 'dark': theme.global.current.value.dark }">
                <div class="header-content">
                    <v-icon size="24" 
                            class="toggle-icon" 
                            :class="{ 'rotated': showUnrelatedNodes }">
                        {{ showUnrelatedNodes ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                    </v-icon>
                    <div class="header-title">
                        <h2 class="text-h5">
                            <v-icon color="warning" class="mr-2">mdi-account-multiple-outline</v-icon>
                            พนักงานไม่มีหัวหน้า
                            <span class="employee-count">({{ unrelatedNodes.length }})</span>
                        </h2>
                    </div>
                </div>
            </div>
            
            <div v-if="unrelatedNodes.length > 0 && showUnrelatedNodes" class="unrelated-nodes"
                :class="{ 'dark': theme.global.current.value.dark }">
                <div class="unrelated-grid">
                    <div v-for="node in unrelatedNodes" :key="node.id" class="node-content unrelated-node"
                        :class="{ 
                            'dark': theme.global.current.value.dark, 
                            'warning': node.deletedAt,
                            'dragging': draggedNode?.id === node.id 
                        }"
                        draggable="true"
                        @dragstart="handleDragStart(node, $event)"
                        @dragover="handleDragOver($event)"
                        @drop="handleDrop(node, $event)"
                        @click="handleNodeClick(node)"
                        v-tooltip="node.deletedAt ? 'พนักงานจะลาออกในวันที่ ' + new Date(node.deletedAt).toLocaleDateString('th-TH') : 'ทำงานอยู่'">
                        <div class="name">{{ node.firstName }} {{ node.lastName }}</div>
                        <div class="position">{{ node.position }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- แสดงโครงสร้างองค์กรปกติ -->
        <div v-if="filteredStructure" class="org-tree">
            <div class="tree">
                <OrgTreeNode
                    v-for="(node, key) in filteredStructure"
                    :key="key"
                    :node="node"
                    :draggedNode="draggedNode"
                    :onNodeClick="handleNodeClick"
                    @structure-updated="handleStructureUpdate"
                />
            </div>
        </div>
        <div v-else>ไม่พบข้อมูลโครงสร้างองค์กร</div>
    </div>
</template>

<style scoped>
.search-container {
    margin: 20px;
    text-align: center;
    animation: fadeInUp 0.5s ease forwards;
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

.search-input:focus {
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
    border-color: #2196f3;
    transform: translateY(-2px);
}

.search-input.dark {
    background: #1E1E1E;
    color: white;
    border-color: #333;
}

.org-tree {
    padding: 20px;
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.tree {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.node {
    margin: 10px;
    text-align: center;
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
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
    cursor: move;
}

.node-content:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.node-content.warning {
    background: linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%);
    border-left: 4px solid #ffa726;
}

.node-content.warning:hover {
    box-shadow: 0 4px 12px rgba(255, 167, 38, 0.2);
}

.node-content.dark {
    background: linear-gradient(135deg, #1E1E1E 0%, #2d2d2d 100%);
    border-color: #4a90e2; 
    color: white;
    border-left: 4px solid #4a90e2; 
}

.node-content.dark.warning {
    background: linear-gradient(135deg, #665e33 0%, #4d4726 100%);
    border-left: 4px solid #ffa726;
    color: #fff3e0;
}

.node-content:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.node-content.dark:hover {
    background: #2D2D2D;
    box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
}

.name {
    font-weight: bold;
    margin-bottom: 5px;
    transition: color 0.3s ease;
}

.position {
    font-size: 0.9em;
    transition: color 0.3s ease;
}

.node-content.warning .position {
    color: #f57c00;
}

.node-content.dark.warning .position {
    color: #ffcc80;
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
    animation: expandChildren 0.5s ease-out;
}

@keyframes expandChildren {
    from {
        opacity: 0;
        transform: scaleY(0);
    }
    to {
        opacity: 1;
        transform: scaleY(1);
    }
}

.children::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 2px;
    height: 20px;
    background: #ccc;
    animation: drawLine 0.5s ease-out;
}

@keyframes drawLine {
    from {
        height: 0;
    }
    to {
        height: 20px;
    }
}

.dialog-content {
    padding: 20px;
    animation: slideUp 0.3s ease-out;
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

.employee-info {
    background-color: var(--v-background);
    border: 1px solid var(--v-border-color);
    transition: all 0.3s ease;
}

.position-section {
    background-color: var(--v-surface-variant);
    border: 1px solid var(--v-border-color);
    margin: 15px 0;
    transition: all 0.3s ease;
}

.management-position-user {
    margin-top: 20px;
    transition: all 0.3s ease;
}

.user-form {
    max-width: 100%;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 15px;
    transition: all 0.3s ease;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.form-control {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--v-border-color);
    border-radius: 8px;
    font-size: 14px;
    background: var(--v-background);
    color: var(--v-text-color);
    transition: all 0.3s ease;
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
    transition: all 0.3s ease;
}

.btn-assign:hover {
    background-color: #45a049;
    transform: translateY(-2px);
}

.unrelated-nodes {
    padding: 20px;
    margin-bottom: 30px;
    background-color: #f8f9fa;
    border-radius: 8px;
    animation: fadeInUp 0.5s ease-out;
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

.unrelated-nodes.dark {
    background-color: #1E1E1E;
}

.unrelated-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 20px;
}

.unrelated-node {
    background-color: #fff;
    border: 2px dashed #ccc;
    transition: all 0.3s ease;
}

.unrelated-node.dark {
    background-color: #1E1E1E;
    border: 2px dashed #333;
}

.unrelated-node.warning {
    background: linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%);
    border: 2px dashed #ffa726;
}

.unrelated-node.dark.warning {
    background: linear-gradient(135deg, #665e33 0%, #4d4726 100%);
    border: 2px dashed #ffa726;
}

.dialog-transition-enter-active,
.dialog-transition-leave-active {
    transition: opacity 0.3s ease;
}

.dialog-transition-enter-from,
.dialog-transition-leave-to {
    opacity: 0;
}

.section-header {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 16px 24px;
    margin: 16px 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.section-header.dark {
    background: linear-gradient(135deg, #1E1E1E 0%, #2d2d2d 100%);
}

.section-header:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.section-header.dark:hover {
    box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
}

.header-content {
    display: flex;
    align-items: center;
    width: 100%;
}

.toggle-icon {
    transition: transform 0.3s ease;
    margin-right: 12px;
}

.toggle-icon.rotated {
    transform: rotate(-180deg);
}

.header-title {
    flex: 1;
}

.header-title h2 {
    margin: 0;
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #333;
}

.dark .header-title h2 {
    color: #fff;
}

.employee-count {
    font-size: 0.9em;
    color: #666;
    margin-left: 8px;
    font-weight: normal;
}

.dark .employee-count {
    color: #aaa;
}

/* อนิเมชันสำหรับการแสดง/ซ่อน */
.unrelated-nodes {
    transition: all 0.3s ease;
    overflow: hidden;
}

/* เพิ่ม Animation */
@keyframes dialogFadeIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
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

/* ปรับแต่งส่วนของ unrelated nodes */
.unrelated-section {
    margin: 20px;
    animation: fadeIn 0.5s ease-out;
}

.section-header {
    background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
    border-radius: 12px;
    padding: 16px 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.section-header.dark {
    background: linear-gradient(135deg, #1E1E1E 0%, #2d2d2d 100%);
}

.unrelated-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 20px;
}

/* ปรับแต่งปุ่มต่างๆ */
.v-btn {
    border-radius: 50px !important;
    text-transform: none !important;
    transition: all 0.3s ease !important;
}

.v-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

/* เพิ่มสไตล์สำหรับ Sweetalert2 */
.custom-swal-container {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.custom-swal-popup {
  border-radius: 24px !important;
  padding: 1.5rem !important;
  background: rgba(255, 255, 255, 0.7) !important; /* ปรับความโปร่งใส */
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37) !important;
}

/* Dark mode popup */
html[data-theme="dark"] .custom-swal-popup {
  background: rgba(30, 30, 30, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* สไตล์สำหรับ title */
.custom-swal-title {
  font-size: 1.5rem !important;
  font-weight: 600 !important;
  color: inherit !important;
  padding: 1rem 0 !important;
}

/* สไตล์สำหรับ icon */
.custom-swal-icon {
  border: none !important;
  margin: 1.5rem auto !important;
}

/* Success icon */
.swal2-success {
  border: none !important;
}

.swal2-success-circular-line-left,
.swal2-success-circular-line-right,
.swal2-success-fix {
  background: transparent !important;
}

/* Warning icon */
.swal2-warning {
  color: #FFC107 !important;
}

/* Progress Bar */
.swal2-timer-progress-bar {
  background: linear-gradient(to right, #2196f3, #4CAF50) !important;
  height: 0.25rem !important;
  opacity: 0.6 !important;
}

/* Dark mode adjustments */
.dark-theme .custom-swal-popup {
  background: linear-gradient(145deg, #1E1E1E 0%, #2d2d2d 100%) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

/* Animation keyframes */
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

/* เพิ่ม backdrop blur */
.swal2-container {
  backdrop-filter: blur(10px) !important;
}

/* เพิ่ม hover effect สำหรับ popup */
.custom-swal-popup:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s ease !important;
}

/* ปรับแต่ง icon container */
.swal2-icon-content {
  font-size: 2.5rem !important;
  font-weight: 600 !important;
}

/* เพิ่ม animation สำหรับ text */
.custom-swal-title, .custom-swal-html-container {
  animation: fadeInUp 0.3s ease forwards !important;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.unrelated-node {
    cursor: move; /* แสดง cursor แบบ move */
    user-select: none; /* ป้องกันการเลือกข้อความระหว่างลาก */
}

.unrelated-node.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

.node-content {
    /* ... existing styles ... */
    transition: all 0.3s ease, outline 0.2s ease;
}

.node-content:hover {
    /* ... existing styles ... */
    outline: 2px dashed #2196f3;
    outline-offset: 2px;
}

.node-content.dark:hover {
    outline-color: #4a90e2;
}

.node-content.drag-over {
    outline: 2px dashed #4CAF50;
    outline-offset: 2px;
    transform: scale(1.02);
}

.node-content.dark.drag-over {
    outline-color: #81C784;
}

.node-content {
    transition: all 0.3s ease, 
                outline 0.2s ease, 
                transform 0.2s ease,
                opacity 0.2s ease;
}
</style>