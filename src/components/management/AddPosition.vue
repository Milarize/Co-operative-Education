<template>
    <div class="add-position">
        <v-dialog v-model="positionStore.showAddDialog" max-width="500px">
            <v-card class="rounded-lg">
                <v-card-title class="text-center pa-4 d-flex align-center" 
                    :style="{
                        background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                        color: '#fff'
                    }">
                    <span class="text-h5 font-weight-medium flex-grow-1">
                        เพิ่มตำแหน่งงาน
                    </span>
                    <v-btn color="white" variant="text" @click="closeDialog" class="close-btn">
                        <v-icon>mdi-close</v-icon>
                        ปิด
                    </v-btn>
                </v-card-title>

                <v-card-text class="mt-6">
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field
                                    v-model="positionName"
                                    label="ชื่อตำแหน่ง"
                                    variant="outlined"
                                    density="comfortable"
                                    required
                                    rounded="pill"
                                    prepend-inner-icon="mdi-briefcase"
                                    :rules="[v => !!v || 'กรุณากรอกชื่อตำแหน่ง']"
                                    placeholder="กรอกชื่อตำแหน่ง"
                                    class="input-field"
                                ></v-text-field>
                            </v-col>
                            <v-col cols="12">
                                <v-textarea
                                    v-model="description"
                                    label="รายละเอียดตำแหน่ง"
                                    variant="outlined"
                                    density="comfortable"
                                    rows="3"
                                    rounded="lg"
                                    prepend-inner-icon="mdi-text-box"
                                    placeholder="กรอกรายละเอียดตำแหน่ง"
                                    class="input-field"
                                    hide-details
                                ></v-textarea>
                            </v-col>
                            <v-col cols="12" class="text-center mt-4">
                                <v-btn
                                    :style="{
                                        background: 'linear-gradient(135deg, #000000 0%, #2196f3 100%)',
                                        color: '#fff',
                                        width: '200px'
                                    }"
                                    @click="savePosition"
                                    class="text-none action-btn"
                                    size="large"
                                    rounded="pill"
                                    :loading="loading"
                                >
                                    <v-icon left class="mr-2">mdi-content-save</v-icon>
                                    บันทึก
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>


            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePositionStore } from '../../data/stores/position'
import Swal from 'sweetalert2'

const positionStore = usePositionStore()
const loading = ref(false)
const positionName = ref('')
const description = ref('')

const closeDialog = () => {
    positionStore.showAddDialog = false
    positionName.value = ''
    description.value = ''
}

const savePosition = async () => {
    try {
        if (!positionName.value) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อตำแหน่ง',
                showConfirmButton: false,
                timer: 1500
            })
            return
        }

        loading.value = true

        const newPosition = {
            name: positionName.value,
            description: description.value
        }

        await positionStore.createPosition(newPosition)
        await positionStore.getAllPositions()

        Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'เพิ่มตำแหน่งงานเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
        })

        closeDialog()
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error)
        Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาด', 
            text: 'ไม่สามารถเพิ่มตำแหน่งงานได้',
            timer: 1500,
            showConfirmButton: false
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.add-position {
    margin: 0;
}

.position-icon {
    display: inline-block;
    animation: bounce 1s infinite;
    margin-left: 8px;
}

.input-field {
    animation: fadeInUp 0.5s ease forwards;
    transition: all 0.3s ease;
}

.input-field:hover {
    transform: translateY(-2px);
}

.action-btn {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    margin: 0 auto;
}

.action-btn::before {
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

.action-btn:hover::before {
    left: 100%;
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
    backdrop-filter: blur(5px);
    transition: transform 0.3s ease;
}

:deep(.v-card:hover) {
    transform: translateY(-2px);
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
