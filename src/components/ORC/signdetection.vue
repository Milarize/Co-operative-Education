<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- หัวข้อ -->
        <v-card elevation="3" class="rounded-lg">
          <v-card-title class="text-center py-6">
            <v-icon size="36" color="primary" class="mb-3">mdi-gesture</v-icon>
            <h2 class="text-h4 font-weight-bold">ระบบตรวจจับลายมือ</h2>
            <div class="text-subtitle-1 text-medium-emphasis">
              อัพโหลดรูปภาพเพื่อตรวจจับและแยกลายเซ็น
            </div>
          </v-card-title>

          <!-- ส่วนอัพโหลดรูปภาพ -->
          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" md="8">
                <v-file-input
                  v-model="selectedFile"
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

                <!-- แสดงรูปภาพที่อัพโหลด -->
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

                <!-- ปุ่มเริ่มตรวจจับ -->
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

        <!-- แสดงผลลัพธ์ -->
        <v-expand-transition>
          <v-card v-if="croppedImages.length > 0" class="mt-6" elevation="3">
            <v-card-title class="py-4 d-flex justify-space-between align-center">
              <div>
                <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                ผลการตรวจจับลายเซ็น
              </div>
              <v-btn
                icon
                @click="showAllResults = !showAllResults"
                :color="showAllResults ? 'primary' : ''"
              >
                <v-icon>{{ showAllResults ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
            </v-card-title>
            
            <v-expand-transition>
              <v-card-text v-if="showAllResults">
                <v-row>
                  <v-col
                    v-for="(image, index) in croppedImages"
                    :key="index"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-hover v-slot="{ isHovering, props }">
                      <v-card
                        v-bind="props"
                        :elevation="isHovering ? 8 : 2"
                        class="transition-swing"
                      >
                        <v-img
                          :src="image"
                          height="200"
                          cover
                          class="bg-grey-lighten-2"
                        />
                        
                        <v-card-actions>
                          <v-btn
                            block
                            color="primary"
                            variant="tonal"
                            @click="downloadImage(image, `signature-${index + 1}.png`)"
                            prepend-icon="mdi-download"
                          >
                            ดาวน์โหลด
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-hover>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-expand-transition>

            <!-- แสดงตัวอย่างย่อ -->
            <v-card-text v-if="!showAllResults">
              <v-row>
                <v-col cols="12" sm="6" md="4">
                  <v-img
                    :src="croppedImages[0]"
                    height="200"
                    cover
                    class="bg-grey-lighten-2 rounded-lg"
                  />
                </v-col>
                <v-col cols="12" sm="6" md="8" class="d-flex align-center">
                  <div class="text-body-1">
                    พบลายเซ็นทั้งหมด {{ croppedImages.length }} รายการ
                    <v-btn
                      color="primary"
                      variant="text"
                      @click="showAllResults = true"
                      class="ml-2"
                    >
                      แสดงทั้งหมด
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-expand-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import Tesseract from 'tesseract.js';

export default defineComponent({
  name: 'TextDetection',
  setup() {
    // Refs
    const canvas = ref<HTMLCanvasElement | null>(null);
    const boundingCanvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const imageUrl = ref<string>('');
    const detectedText = ref<string>('');
    const croppedImages = ref<string[]>([]);
    const isProcessing = ref(false);
    const selectedFile = ref<File | null>(null);
    const showAllResults = ref(false);

    // Methods
    const onImageUpload = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      imageUrl.value = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        if (!canvas.value || !boundingCanvas.value) return;

        canvas.value.width = img.naturalWidth;
        canvas.value.height = img.naturalHeight;
        boundingCanvas.value.width = img.naturalWidth;
        boundingCanvas.value.height = img.naturalHeight;
        
        const ctx = canvas.value.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      
      img.src = imageUrl.value;
    };

    const cropSignature = (originalCanvas: HTMLCanvasElement, bbox?: { x0: number, y0: number, x1: number, y1: number }) => {
      const ctx = originalCanvas.getContext('2d');
      if (!ctx) return null;

      const signatureCanvas = document.createElement('canvas');
      const width = bbox ? bbox.x1 - bbox.x0 : originalCanvas.width;
      const height = bbox ? bbox.y1 - bbox.y0 : originalCanvas.height;
      
      signatureCanvas.width = width;
      signatureCanvas.height = height;
      
      const signatureCtx = signatureCanvas.getContext('2d');
      if (!signatureCtx) return null;

      if (bbox) {
        // ปรับคอนทราสก่อน crop
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(originalCanvas, bbox.x0, bbox.y0, width, height, 0, 0, width, height);
          const imageData = tempCtx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // ปรับคอนทราสให้สูงสุด
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // แปลงเป็นขาว-ดำ
            const intensity = (r + g + b) / 3;
            data[i] = data[i + 1] = data[i + 2] = intensity < 128 ? 0 : 255;
            data[i + 3] = 255; // ความทึบแสงสูงสุด
          }

          tempCtx.putImageData(imageData, 0, 0);
          signatureCtx.drawImage(tempCanvas, 0, 0);
        }
      } else {
        signatureCtx.drawImage(originalCanvas, 0, 0);
      }

      const imageData = signatureCtx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // ประมวลผลภาพ
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const intensity = (r + g + b) / 3;
        const colorVariance = Math.abs(r - intensity) + Math.abs(g - intensity) + Math.abs(b - intensity);
        const isTypedText = colorVariance < 30 && intensity < 200;
        
        if (isTypedText || intensity > 240) {
          data[i + 3] = 0; // ทำให้โปร่งใส
        } else {
          data[i] = data[i + 1] = data[i + 2] = intensity < 128 ? 0 : 255;
          data[i + 3] = 255;
        }
      }

      signatureCtx.putImageData(imageData, 0, 0);
      return signatureCanvas.toDataURL();
    };

    const detectText = async () => {
      if (!imageUrl.value || !canvas.value || !boundingCanvas.value) return;
      isProcessing.value = true;
      showAllResults.value = false;

      try {
        const result = await Tesseract.recognize(
          imageUrl.value,
          'eng+tha',
          {
            logger: (m) => console.log(m),
            tessedit_char_blacklist: '0123456789',
            tessedit_enable_doc_dict: '0',
            tessedit_pageseg_mode: '1'
          }
        );

        const ctx = canvas.value.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
          if (!canvas.value || !boundingCanvas.value) return;

          // ตั้งค่าขนาด canvas
          canvas.value.width = img.naturalWidth;
          canvas.value.height = img.naturalHeight;
          boundingCanvas.value.width = img.naturalWidth;
          boundingCanvas.value.height = img.naturalHeight;
          
          ctx.drawImage(img, 0, 0);

          // ประมวลผลข้อความที่ตรวจพบ
          result.data.words.forEach(word => {
            const bbox = word.bbox;
            const confidence = word.confidence;
            
            if (confidence > 80) {
              ctx.fillStyle = 'white';
              ctx.fillRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
            }
          });

          // ตัดภาพลายเซ็น
          const signatureImage = cropSignature(canvas.value);
          const handwrittenSignatures = result.data.words
            .filter(word => word.confidence <= 80)
            .map(word => cropSignature(canvas.value, word.bbox))
            .filter((img): img is string => img !== null);

          croppedImages.value = [signatureImage, ...handwrittenSignatures].filter((img): img is string => img !== null);

          // วาดกรอบ
          const boundingCtx = boundingCanvas.value.getContext('2d');
          if (boundingCtx) {
            boundingCtx.drawImage(canvas.value, 0, 0);

            result.data.words.forEach(word => {
              const bbox = word.bbox;
              boundingCtx.strokeStyle = word.confidence > 80 ? 'blue' : 'red';
              boundingCtx.lineWidth = 2;
              boundingCtx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
            });
          }
        };
        img.src = imageUrl.value;

        detectedText.value = result.data.text;
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการตรวจจับลายมือ:', error);
      } finally {
        isProcessing.value = false;
      }
    };

    const downloadImage = (dataUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    onMounted(() => {
      console.log('Component Mounted');
    });

    return {
      canvas,
      boundingCanvas,
      imageRef,
      imageUrl,
      detectedText,
      onImageUpload,
      detectText,
      croppedImages,
      downloadImage,
      showAllResults,
    };
  },
});
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

/* การจัดการ Theme */
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