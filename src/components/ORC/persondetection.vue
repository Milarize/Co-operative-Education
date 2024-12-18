<script lang="ts" setup>
import { onMounted, ref } from "vue";

const file = ref<File | null>(null);
const processedImage = ref<string | null>(null); 
const originalFile = ref<string | null>(null);
const processedImageList = ref<string[]>([]);
const rotationAngle = ref<number>(0);

const processImage = async () => {
  if (!file.value) {
    alert("กรุณาเลือกไฟล์");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e: any) => {
    originalFile.value = e.target.result;
    
    if (!originalFile.value) {
      return;
    }
    
    // เรียกใช้ Hough Transform และหมุนภาพ
    const { resultImage, angle } = await detectAndRotateImage(originalFile.value);
    rotationAngle.value = angle;
    processedImage.value = resultImage;
    processedImageList.value.push(resultImage);
  };
  reader.readAsDataURL(file.value);
};

const detectAndRotateImage = async (imageData: string): Promise<{resultImage: string, angle: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const src = cv.imread(canvas);
        const dst = new cv.Mat();
        const lines = new cv.Mat();
        const gray = new cv.Mat();
        
        // แปลงเป็นภาพขาวดำ
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // ใช้ Gaussian Blur ลด noise
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

        // ลบพื้นหลังสีขาว
        const thresh = new cv.Mat();
        cv.threshold(gray, thresh, 250, 255, cv.THRESH_BINARY_INV);

        // หาขอบเขตของเนื้อหาในภาพ
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // หาพื้นที่ที่ใหญ่ที่สุดที่ไม่ใช่สีขาว
        let maxArea = 0;
        let maxRect = new cv.Rect();
        for (let i = 0; i < contours.size(); i++) {
          const rect = cv.boundingRect(contours.get(i));
          const area = rect.width * rect.height;
          if (area > maxArea) {
            maxArea = area;
            maxRect = rect;
          }
        }

        // ตัดภาพตามขอบเขตที่พบ
        let cropped = src.roi(new cv.Rect(maxRect.x, maxRect.y, maxRect.width, maxRect.height));
        
        // ใช้ morphological operations เพื่อลบ noise
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        const cleaned = new cv.Mat();
        cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, kernel);
        
        // ใช้ Canny Edge Detection
        cv.Canny(cleaned, dst, 50, 200, 3);
        
        // ใช้ Hough Transform ตรวจจับเส้นตรง
        cv.HoughLines(dst, lines, 1, Math.PI / 180, 150);
        
        // คำนวณองศาการหมุนจากเส้น Hough
        let dominantAngle = 0;
        let maxCount = 0;
        const angleHistogram: {[key: number]: number} = {};
        
        for (let i = 0; i < lines.rows; i++) {
          const theta = lines.data32F[i * 2 + 1];
          const angleDeg = (theta * 180 / Math.PI) % 180;
          const roundedAngle = Math.round(angleDeg);
          
          angleHistogram[roundedAngle] = (angleHistogram[roundedAngle] || 0) + 1;
          
          if (angleHistogram[roundedAngle] > maxCount) {
            maxCount = angleHistogram[roundedAngle];
            dominantAngle = roundedAngle;
          }
        }

        // ปรับองศาให้อยู่ในช่วงที่เหมาะสม
        let rotationAngle = dominantAngle;
        if (rotationAngle > 45) {
          rotationAngle = rotationAngle - 90;
        } else if (rotationAngle < -45) {
          rotationAngle = rotationAngle + 90;
        }

        // สร้าง Mat สีขาว
        const whiteBackground = new cv.Mat(cropped.rows, cropped.cols, cropped.type(), new cv.Scalar(255, 255, 255, 255));
        
        // หมุนภาพ
        const center = new cv.Point(cropped.cols / 2, cropped.rows / 2);
        const rotationMatrix = cv.getRotationMatrix2D(center, rotationAngle, 1.0);
        const rotatedImage = new cv.Mat();
        cv.warpAffine(cropped, rotatedImage, rotationMatrix, new cv.Size(cropped.cols, cropped.rows));

        // รวมภาพกับพื้นหลังสีขาว
        const finalImage = new cv.Mat();
        cv.addWeighted(rotatedImage, 1, whiteBackground, 0, 0, finalImage);

        const outputCanvas = document.createElement('canvas');
        cv.imshow(outputCanvas, finalImage);
        
        // ล้างหน่วยความจำ
        src.delete();
        dst.delete();
        lines.delete();
        gray.delete();
        thresh.delete();
        cleaned.delete();
        kernel.delete();
        rotatedImage.delete();
        rotationMatrix.delete();
        cropped.delete();
        contours.delete();
        hierarchy.delete();
        whiteBackground.delete();
        finalImage.delete();

        resolve({
          resultImage: outputCanvas.toDataURL('image/jpeg', 1.0),
          angle: rotationAngle
        });
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการประมวลผลภาพ:', error);
        resolve({
          resultImage: canvas.toDataURL('image/jpeg', 1.0),
          angle: 0
        });
      }
    };
    img.src = imageData;
  });
};

const clearHistory = () => {
  processedImageList.value = [];
};

const downloadImage = (imageUrl: string, index: number) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `processed-image-${index + 1}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card elevation="3" class="rounded-lg">
          <v-card-title class="text-center py-6">
            <v-icon size="36" color="primary" class="mb-3">mdi-vector-line</v-icon>
            <h2 class="text-h4 font-weight-bold">ระบบตรวจจับเส้นและปรับองศาอัตโนมัติ</h2>
            <div class="text-subtitle-1 text-medium-emphasis">
              อัพโหลดรูปภาพเพื่อตรวจจับเส้นตรงและปรับองศา
            </div>
          </v-card-title>

          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" md="8">
                <v-file-input v-model="file" accept="image/*" @change="processImage"
                  :rules="[v => !!v || 'กรุณาเลือกไฟล์รูปภาพ']" placeholder="เลือกไฟล์รูปภาพที่ต้องการตรวจจับ"
                  prepend-icon="mdi-image" label="อัพโหลดรูปภาพ" variant="outlined" rounded="lg" show-size
                  class="mb-4" />

                <v-row v-if="file || processedImage">
                  <v-col cols="12" sm="6">
                    <v-fade-transition>
                      <v-card v-if="originalFile" class="mb-4 pa-2" variant="outlined">
                        <v-card-title class="text-subtitle-1">ภาพต้นฉบับ</v-card-title>
                        <div class="d-flex justify-center">
                          <v-img :src="originalFile" max-height="400" contain class="rounded-lg">
                            <template v-slot:placeholder>
                              <v-row align="center" justify="center">
                                <v-progress-circular indeterminate color="primary" />
                              </v-row>
                            </template>
                          </v-img>
                        </div>
                      </v-card>
                    </v-fade-transition>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-fade-transition>
                      <v-card v-if="processedImage" class="mb-4 pa-2" variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          ผลลัพธ์การปรับองศา ({{ rotationAngle }}°)
                        </v-card-title>
                        <div class="d-flex justify-center">
                          <v-img :src="processedImage" max-height="400" contain class="rounded-lg">
                            <template v-slot:placeholder>
                              <v-row align="center" justify="center">
                                <v-progress-circular indeterminate color="primary" />
                              </v-row>
                            </template>
                          </v-img>
                        </div>
                      </v-card>
                    </v-fade-transition>
                  </v-col>
                </v-row>

                <v-expand-transition>
                  <v-card v-if="processedImageList.length > 0" class="mt-6" elevation="3">
                    <v-card-title class="py-4 d-flex justify-space-between align-center">
                      <div>
                        <v-icon color="primary" class="mr-2">mdi-history</v-icon>
                        ประวัติการประมวลผล
                      </div>
                      <v-btn icon color="error" variant="text" @click="clearHistory">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </v-card-title>

                    <v-card-text>
                      <v-row>
                        <v-col v-for="(image, index) in processedImageList" :key="index" cols="12" sm="6" md="4">
                          <v-hover v-slot="{ isHovering, props }">
                            <v-card v-bind="props" :elevation="isHovering ? 8 : 2" class="transition-swing">
                              <v-img :src="image" height="200" cover class="bg-grey-lighten-2" />
                              <v-card-actions>
                                <v-btn block color="primary" variant="tonal" @click="downloadImage(image, index)"
                                  prepend-icon="mdi-download">
                                  ดาวน์โหลด
                                </v-btn>
                              </v-card-actions>
                            </v-card>
                          </v-hover>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-expand-transition>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.transition-swing {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.v-card {
  border-radius: 16px;
  overflow: hidden;
}

.v-btn {
  transition: transform 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
}

.v-img {
  transition: transform 0.3s ease;
}

.v-img:hover {
  transform: scale(1.02);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.v-card {
  animation: fadeIn 0.5s ease-out;
}
</style>