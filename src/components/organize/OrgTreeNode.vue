<script setup lang="ts">
import { useUserStore } from '../../data/stores/user'
import { useTheme } from 'vuetify'
import Swal from 'sweetalert2'

interface NodeProps {
  node: {
    id: number
    firstName: string
    lastName: string
    position: string
    deletedAt?: string
    subordinates?: NodeProps['node'][]
  }
  draggedNode: NodeProps['node'] | null
  onNodeClick: (node: NodeProps['node']) => void
}

defineProps<NodeProps>()

const theme = useTheme()
const userStore = useUserStore()

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

const handleDragStart = (node: NodeProps['node'], event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', node.id.toString())
    event.dataTransfer.setData('application/json', JSON.stringify({
      id: node.id,
      firstName: node.firstName,
      lastName: node.lastName,
      position: node.position,
      subordinates: node.subordinates
    }))
    console.log('Drag started with data:', node)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.add('drag-over')
}

const handleDragLeave = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement
  target.classList.remove('drag-over') 
}

const handleDrop = async (targetNode: NodeProps['node'], event: DragEvent) => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.remove('drag-over')

  try {
    if (!event.dataTransfer) {
      showAlert('error', 'ไม่พบข้อมูลที่ถูกลาก')
      return
    }

    const draggedId = event.dataTransfer.getData('text/plain')
    if (!draggedId) {
      showAlert('error', 'ไม่พบข้อมูล ID')
      return
    }

    if (!targetNode?.id) {
      showAlert('error', 'ข้อมูล target node ไม่ถูกต้อง')
      return
    }

    if (targetNode.id === parseInt(draggedId)) {
      showAlert('warning', 'ไม่สามารถวางที่ node เดียวกันได้')
      return
    }

    await userStore.assignSubordinate(targetNode.id, parseInt(draggedId))
    await userStore.getStructure()

    showAlert('success', 'อัพเดทโครงสร้างสำเร็จ')
  } catch (error) {
    showAlert('error', 'เกิดข้อผิดพลาดในการย้ายตำแหน่ง', error instanceof Error ? error.message : undefined)
  }
}
</script>

<template>
  <div class="node">
    <div 
      class="node-content" 
      :class="{
        'dark': theme.global.current.value.dark,
        'warning': node.deletedAt,
        'dragging': draggedNode?.id === node.id
      }" 
      draggable="true"
      @dragstart="handleDragStart(node, $event)"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave" 
      @drop="handleDrop(node, $event)"
      @click="onNodeClick(node)"
      v-tooltip="node.deletedAt 
        ? `พนักงานจะลาออกในวันที่ ${new Date(node.deletedAt).toLocaleDateString('th-TH')}` 
        : 'ทำงานอยู่'"
    >
      <div class="name">{{ node.firstName }} {{ node.lastName }}</div>
      <div class="position">{{ node.position }}</div>
    </div>

    <div v-if="node.subordinates?.length" class="children">
      <OrgTreeNode
        v-for="subordinate in node.subordinates"
        :key="subordinate.id"
        :node="subordinate"
        :draggedNode="draggedNode"
        :onNodeClick="onNodeClick"
      />
    </div>
  </div>
</template>

<style scoped>
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
  cursor: move;
  transition: all 0.3s ease, 
              outline 0.2s ease, 
              transform 0.2s ease,
              opacity 0.2s ease;
  border-left: 4px solid #2196f3;
}

.node-content:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  outline: 2px dashed #2196f3;
  outline-offset: 2px;
}

.node-content.dark {
  background: linear-gradient(135deg, #1E1E1E 0%, #2d2d2d 100%);
  border-color: #4a90e2;
  color: white;
}

.node-content.warning {
  background: linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%);
  border-left: 4px solid #ffa726;
}

.node-content.drag-over {
  outline: 2px dashed #4CAF50;
  outline-offset: 2px;
  transform: scale(1.02);
  background-color: rgba(76, 175, 80, 0.1);
}

.node-content.dark.drag-over {
  outline-color: #81C784;
  background-color: rgba(129, 199, 132, 0.1);
}

.node-content.dragging {
  opacity: 0.5;
  transform: scale(0.95);
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
  background: #ccc;
}

.name {
  font-weight: bold;
  margin-bottom: 5px;
}

.position {
  font-size: 0.9em;
}
</style>