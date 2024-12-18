<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">

        <v-card elevation="3" class="rounded-lg">
          <v-card-title class="text-center py-6">
            <v-icon size="36" color="primary" class="mb-3">mdi-gesture</v-icon>
            <h2 class="text-h4 font-weight-bold">ระบบตรวจจับลายมือ</h2>
            <div class="text-subtitle-1 text-medium-emphasis">
              อัพโหลดรูปภาพเพื่อตรวจจับและแยกลายเซ็น
            </div>
          </v-card-title>


          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" md="8">
                <v-file-input
                
                  accept="image/*"
                  @change="onImageUpload"
                  :rules="[v => !!v || 'กรุณาเลือกไฟล์รูปภาพ']"
                  placeholder="เลือกไฟล์รูปภาพที่ต้องการตรวจจับ"
                  prepend-icon="mdi-camera"
                  label="อัพโหลดรูปภาพ"
                  variant="outlined"
                  rounded="lg"
                  show-size
                  class="mb-4"
                />


                <v-fade-transition>
                  <v-card v-if="imageUrl" class="mb-4 pa-2" variant="outlined">
                    <div class="d-flex justify-center position-relative">
                      <v-img
                        :src="imageUrl"
                        max-height="400"
                        contain
                        class="rounded-lg"
                      >
                        <template v-slot:placeholder>
                          <v-row align="center" justify="center">
                            <v-progress-circular indeterminate color="primary" />
                          </v-row>
                        </template>
                      </v-img>
                      <canvas ref="canvas" class="d-none" />
                      <canvas ref="boundingCanvas" class="overlay-canvas" />
                    </div>
                  </v-card>
                </v-fade-transition>

 
                <v-btn
                  block
                  color="primary"
                  size="large"
                  :loading="isProcessing"
                  :disabled="!imageUrl || isProcessing"
                  @click="detectText"
                  class="mb-6"
                  rounded="lg"
                >
                  <v-icon left class="mr-2">mdi-magnify</v-icon>
                  เริ่มตรวจจับลายมือ
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>


        <v-fade-transition>
          <v-card v-if="croppedImages.length > 0" class="mt-6" elevation="3">
            <v-card-title class="py-4">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              ผลการตรวจจับลายเซ็น
            </v-card-title>
            
            <v-card-text>
              <v-row justify="center">
                <v-col cols="12" sm="8" md="6">
                  <v-card class="pa-2" variant="outlined">
                    <v-img
                      :src="croppedImages[0]"
                      height="300"
                      contain
                      class="bg-grey-lighten-2 rounded-lg"
                    />
                    <v-card-actions class="justify-center">
                      <v-btn
                        color="primary"
                        variant="tonal"
                        @click="downloadImage(croppedImages[0], 'signature.png')"
                        prepend-icon="mdi-download"
                      >
                        ดาวน์โหลดลายเซ็น
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-fade-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'


const imageUrl = ref<string | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const boundingCanvas = ref<HTMLCanvasElement | null>(null)
const croppedImages = ref<string[]>([])
const isProcessing = ref(false)
const showAllResults = ref(false)


const onImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    imageUrl.value = URL.createObjectURL(file)
    croppedImages.value = [] 
    showAllResults.value = false
  }
}


const detectText = async () => {
  if (!imageUrl.value || !canvas.value || !boundingCanvas.value) return
  
  isProcessing.value = true
  try {
    const img = new Image()
    img.src = imageUrl.value
    
    await new Promise((resolve) => {
      img.onload = () => {

        canvas.value!.width = img.width
        canvas.value!.height = img.height
        boundingCanvas.value!.width = img.width
        boundingCanvas.value!.height = img.height
        
        const ctx = canvas.value!.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        

        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const boundingBox = findSignatureBoundingBox(imageData)
        
        if (boundingBox) {
          const croppedSignature = cropToFinalSize(img, boundingBox)
          if (croppedSignature) {
            croppedImages.value = [croppedSignature]
          }
        }
        
        resolve(true)
      }
    })
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประมวลผล:', error)
  } finally {
    isProcessing.value = false
  }
}


const findSignatureBoundingBox = (imageData: ImageData) => {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let found = false
  
  const threshold = 128
  

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
      
      if (gray < threshold) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
        found = true
      }
    }
  }
  
  if (!found) return null
  

  if (boundingCanvas.value) {
    const ctx = boundingCanvas.value.getContext('2d')!
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// ฟังก์ชัน crop และปรับขนาดเป็น 8x5 cm
const cropToFinalSize = (img: HTMLImageElement, box: { x: number, y: number, width: number, height: number }) => {
  const DPI = 96
  const pixelsPerCm = DPI / 2.54
  const targetWidth = 8 * pixelsPerCm
  const targetHeight = 5 * pixelsPerCm
  
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = targetWidth
  tempCanvas.height = targetHeight
  
  const ctx = tempCanvas.getContext('2d')!
  
  // เปลี่ยนเป็นพื้นหลังโปร่งใส
  ctx.clearRect(0, 0, targetWidth, targetHeight)
  
  // คำนวณอัตราส่วนการปรับขนาด
  const scaleX = targetWidth / box.width
  const scaleY = targetHeight / box.height
  const scale = Math.min(scaleX, scaleY)
  
  const scaledWidth = box.width * scale
  const scaledHeight = box.height * scale
  const offsetX = (targetWidth - scaledWidth) / 2
  const offsetY = (targetHeight - scaledHeight) / 2

  // วาดภาพต้นฉบับลงบน canvas ชั่วคราว
  const tempCanvas2 = document.createElement('canvas')
  tempCanvas2.width = box.width
  tempCanvas2.height = box.height
  const ctx2 = tempCanvas2.getContext('2d')!
  ctx2.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height)

  // ลบพื้นหลัง
  const imageData = ctx2.getImageData(0, 0, box.width, box.height)
  const data = imageData.data
  const threshold = 200 // ค่าความเข้มของสีที่จะถือว่าเป็นพื้นหลัง

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3

    if (brightness > threshold) {
      data[i + 3] = 0 // ตั้งค่า alpha เป็น 0 (โปร่งใส)
    }
  }

  ctx2.putImageData(imageData, 0, 0)

  // วาดภาพที่ลบพื้นหลังแล้วลงบน canvas หลัก
  ctx.drawImage(
    tempCanvas2,
    0, 0, box.width, box.height,
    offsetX, offsetY, scaledWidth, scaledHeight
  )
  
  return tempCanvas.toDataURL('image/png')
}


const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
</script>
<style scoped>
.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}

.transition-swing {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

/* การจัดาร Theme */
:root {
  --primary-color: #2196f3;
  --text-color: #333;
  --bg-color: #fff;
  --border-color: #e0e0e0;
}

.dark {
  --primary-color: #4a90e2;
  --text-color: #fff;
  --bg-color: #1E1E1E;
  --border-color: #2d2d2d;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Components */
h1 {
  text-align: center;
  margin: 20px 0;
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--text-color);
  animation: fadeInDown 0.5s ease;
}

.image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 20px auto;
  padding: 24px;
  max-width: 800px;
  background: var(--bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: fadeIn 0.5s ease-out;
}

input[type="file"] {
  padding: 12px 24px;
  border-radius: 50px;
  border: 2px dashed var(--primary-color);
  background: var(--bg-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

input[type="file"]:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

button {
  display: block;
  margin: 20px auto;
  padding: 12px 32px;
  font-size: 16px;
  border: none;
  border-radius: 50px;
  background: var(--primary-color);
  color: var(--bg-color);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

button:disabled {
  background: var(--border-color);
  cursor: not-allowed;
}

.result {
  margin: 20px auto;
  padding: 24px;
  max-width: 800px;
  border-radius: 12px;
  background: var(--bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-out;
}

.result h3 {
  margin-top: 0;
  color: var(--primary-color);
  font-weight: 500;
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.signature-item {
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

.signature-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.signature-item img {
  max-width: 100%;
  height: auto;
  margin-bottom: 12px;
  border-radius: 8px;
}
</style>