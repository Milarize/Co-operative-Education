<script lang="ts" setup>
import { onMounted, ref } from "vue";
import * as faceapi from "face-api.js";

const file = ref<File | null>(null);
const processedImage = ref<string | null>(null);
const originalFile = ref<string | null>(null);
const originalImage = ref<HTMLImageElement | null>(null);
const processedImageList = ref<string[]>([]);

const loadModels = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
};
onMounted(async () => {
  await loadModels();
});

const rotateAndDetectFaces = async (canvas: HTMLCanvasElement) => {
  let angle = 0;
  let bestAngle = 0;
  let maxConfidence = 0;
  let hasDetected = false;

  while (angle < 360) {
    const detections = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detections && detections.detection.score > maxConfidence) {
      maxConfidence = detections.detection.score;
      bestAngle = angle;
      hasDetected = true;
    }

    canvas = rotateCanvas(canvas, 90);
    angle += 90;
  }

  if (hasDetected) {
    // หมุนภาพไปยังมุมที่ดีที่สุด
    if (bestAngle > 0) {
      canvas = rotateCanvas(canvas, bestAngle);
    }



    processedImage.value = canvas.toDataURL();
    processedImageList.value.push(processedImage.value);
  }
};

const rotateCanvas = (originalCanvas: HTMLCanvasElement, degrees: number) => {
  const rotatedCanvas = document.createElement("canvas");
  const ctx = rotatedCanvas.getContext("2d");

  if (degrees === 90 || degrees === 270) {
    rotatedCanvas.width = originalCanvas.height;
    rotatedCanvas.height = originalCanvas.width;
  } else {
    rotatedCanvas.width = originalCanvas.width;
    rotatedCanvas.height = originalCanvas.height;
  }

  ctx!.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
  ctx!.rotate((degrees * Math.PI) / 180);
  ctx!.drawImage(originalCanvas, -originalCanvas.width / 2, -originalCanvas.height / 2);

  return rotatedCanvas;
};

const isBlueBackground = (image: HTMLImageElement): boolean => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0, image.width, image.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let bluePixels = 0;
  const totalPixels = imgData.width * imgData.height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (b > 150 && b > r && b > g) {
      bluePixels++;
    }
  }

  const bluePercentage = (bluePixels / totalPixels) * 100;
  return bluePercentage > 40;
};

const processImage = async () => {
  if (!file.value) {
    alert("กรุณาเลือกไฟล์");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e: any) => {
    originalFile.value = e.target.result;
    const image = new Image();
    image.src = e.target.result;
    image.onload = async () => {
      if (isBlueBackground(image)) {
        // ถ้าเป็นพื้นหลังสีฟ้า ให้ตัดขอบเพิ่มเติม
        const borderlessImage = await removeImageBorders(originalFile.value!);
        processedImage.value = borderlessImage;
        processedImageList.value.push(borderlessImage);
      } else {
        await applyShadowDetection(image);
        if (processedImage.value) {
          const borderlessImage = await removeImageBorders(processedImage.value);
          processedImageList.value.push(borderlessImage);
        }
      }
    };
  };
  reader.readAsDataURL(file.value);
};

const applyShadowDetection = async (image: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0, image.width, image.height);

  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const thresh = new cv.Mat();
  const blur = new cv.Mat();

  // แปลงเป็นภาพขาวดำ
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // ลดนอยส์ด้วย Gaussian Blur
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

  // ใช้ Canny Edge Detection แทน Adaptive Threshold
  cv.Canny(blur, thresh, 50, 150, 3, false);

  // ทำ Morphological Operations เพื่อเชื่อมขอบที่ขาดให้สมบูรณ์
  const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.dilate(thresh, thresh, kernel, new cv.Point(-1, -1), 1);
  cv.erode(thresh, thresh, kernel, new cv.Point(-1, -1), 1);

  let attempts = 0;
  const maxAttempts = 4;

  while (attempts < maxAttempts) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours.size() > 0) {
      // หาพื้นที่ที่ใหญ่ที่สุดที่มีอัตราส่วนใกล้เคียงกับรูปถ่ายติดบัตร
      let bestContour = -1;
      let bestScore = Number.MAX_VALUE;
      const targetRatio = 4 / 3; // อัตราส่วนมาตรฐานของรูปถ่ายติดบัตร

      for (let i = 0; i < contours.size(); i++) {
        const rect = cv.boundingRect(contours.get(i));
        const area = rect.width * rect.height;
        const ratio = rect.width / rect.height;
        const ratioScore = Math.abs(ratio - targetRatio);

        // พิจารณาทั้งขนาดและอัตราส่วน
        if (area > 10000 && ratioScore < bestScore) { // ขนาดขั้นต่ำเพื่อกรองพื้นที่เล็กๆ ออก
          bestScore = ratioScore;
          bestContour = i;
        }
      }

      if (bestContour !== -1) {
        const boundingRect = cv.boundingRect(contours.get(bestContour));

        // เพิ่มระยะขอบเล็กน้อย
        const padding = 10;
        const x = Math.max(0, boundingRect.x - padding);
        const y = Math.max(0, boundingRect.y - padding);
        const width = Math.min(image.width - x, boundingRect.width + (padding * 2));
        const height = Math.min(image.height - y, boundingRect.height + (padding * 2));

        // วาดกรอบแสดงพื้นที่ที่จะครอป
        const point1 = new cv.Point(x, y);
        const point2 = new cv.Point(x + width, y + height);
        cv.rectangle(src, point1, point2, new cv.Scalar(255, 0, 0, 255), 2);

        const croppedCanvas = document.createElement("canvas");
        const croppedCtx = croppedCanvas.getContext("2d")!;
        croppedCanvas.width = width;
        croppedCanvas.height = height;
        croppedCtx.drawImage(
          image,
          x,
          y,
          width,
          height,
          0,
          0,
          width,
          height
        );

        // หลังจากได้ภาพที่ครอปแล้ว นำไปผ่านการประมวลผลเพิ่มเติม
        const croppedImage = croppedCanvas.toDataURL();

        try {
          // ปรับปรุงภาพให้ได้มาตรฐาน
          const standardizedImage = await standardizeIDPhoto(croppedImage);
          // ตัดขอบส่วนเกิน
          const borderlessImage = await removeBorders(standardizedImage);

          // บันทึกผลลัพธ์
          processedImage.value = borderlessImage;
          processedImageList.value.push(borderlessImage);

          // ตรวจจับและหมุนใบหน้า
          const finalCanvas = document.createElement('canvas');
          const finalCtx = finalCanvas.getContext('2d')!;
          const finalImg = new Image();

          finalImg.onload = async () => {
            finalCanvas.width = finalImg.width;
            finalCanvas.height = finalImg.height;
            finalCtx.drawImage(finalImg, 0, 0);

            // ตรวจจับและหมุนใบหน้า
            await rotateAndDetectFaces(finalCanvas);
          };

          finalImg.src = borderlessImage;
        } catch (error) {
          console.error('Error processing image:', error);
        }

        // Clean up
        contours.delete();
        hierarchy.delete();
        kernel.delete();
        break;
      }
    }

    // ปรับค่า threshold ถ้าไม่พบขอบที่เหมาะสม
    cv.Canny(blur, thresh, 50 - (attempts * 10), 150 - (attempts * 20), 3, false);
    attempts++;
  }

  // Clean up
  src.delete();
  gray.delete();
  thresh.delete();
  blur.delete();
}

const cancel = () => {
  file.value = null;
  processedImage.value = null;
  originalFile.value = null;
  originalImage.value = null;
  processedImageList.value = [];
};

// เพิ่มฟังก์ชันใหม่
const standardizeIDPhoto = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // กำหนดขนาดมาตรฐานสำหรับรูปถ่ายติดบัตร (กว้าง 35mm x สูง 45mm ที่ 300 DPI)
      const targetWidth = 413;  // 35mm ที่ 300 DPI
      const targetHeight = 531; // 45mm ที่ 300 DPI

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // วาดพื้นหลังสีขาว
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // คำนวณอัตราส่วนเพื่อรักษาสัดส่วนภาพ
      const scale = Math.min(
        targetWidth / img.width,
        targetHeight / img.height
      );

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // คำนวณตำแหน่งกึ่งกลาง
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      // วาดภาพที่ปรับขนาดแล้ว
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    img.src = imageData;
  });
};

// เพิ่มฟังก์ชันใหม่สำหรับตัดขอบ
const removeBorders = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // วาดภาพลงบน canvas ชั่วคราว
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // หาขอบของภาพจริง
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      // ค่าความแตกต่างของสีที่ยอมรับได้
      const threshold = 30;
      // สีขาวมาตรฐาน
      const whiteR = 255;
      const whiteG = 255;
      const whiteB = 255;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // ตรวจสอบว่าพิกเซลนี้ไม่ใช่สีขาวหรือสีใกล้เคียง
          const diffR = Math.abs(r - whiteR);
          const diffG = Math.abs(g - whiteG);
          const diffB = Math.abs(b - whiteB);

          if (diffR > threshold || diffG > threshold || diffB > threshold) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // เพิ่มระยะขอบเล็กน้อย
      const padding = 2;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      // สร้าง canvas ใหม่สำหรับภาพที่ตัดขอบแล้ว
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d')!;

      const width = maxX - minX;
      const height = maxY - minY;

      croppedCanvas.width = width;
      croppedCanvas.height = height;

      // วาดเฉพาะส่วนที่ต้องการ
      croppedCtx.drawImage(
        canvas,
        minX, minY, width, height,
        0, 0, width, height
      );

      resolve(croppedCanvas.toDataURL('image/jpeg', 1.0));
    };
    img.src = imageData;
  });
};

// เพิ่มฟังก์ชันใหม่
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

const findCorners = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const corners = new cv.Mat();

      // แปลงเป็นภาพขาวดำ
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // ใช้ Harris Corner Detection
      cv.cornerHarris(gray, corners, 2, 3, 0.04);

      // ทำ Normalization
      let dest = new cv.Mat();
      cv.normalize(corners, dest, 0, 255, cv.NORM_MINMAX, cv.CV_8U);

      // วาดจุดที่เป็นมุม
      for (let i = 0; i < dest.rows; i++) {
        for (let j = 0; j < dest.cols; j++) {
          if (dest.ucharPtr(i, j)[0] > 200) {
            cv.circle(src, new cv.Point(j, i), 5, new cv.Scalar(0, 0, 255, 255), 2);
          }
        }
      }

      // แปลงกลับเป็น Data URL
      const outputCanvas = document.createElement('canvas');
      cv.imshow(outputCanvas, src);

      // Clean up
      src.delete();
      gray.delete();
      corners.delete();
      dest.delete();

      resolve(outputCanvas.toDataURL('image/jpeg', 1.0));
    };
    img.src = imageData;
  });
};

const removeImageBorders = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();

      // แปลงเป็นภาพขาวดำ
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // ใช้ Adaptive Threshold เพื่อจัดการกับความแตกต่างของแสง
      const binary = new cv.Mat();
      cv.adaptiveThreshold(gray, binary, 255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11, 2);

      // ใช้ morphological operations เพื่อลบ noise
      const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
      const cleaned = new cv.Mat();
      cv.morphologyEx(binary, cleaned, cv.MORPH_CLOSE, kernel);

      // หาขอบภาพด้วย Sobel
      const gradX = new cv.Mat();
      const gradY = new cv.Mat();
      const gradient = new cv.Mat();

      cv.Sobel(cleaned, gradX, cv.CV_64F, 1, 0, 3);
      cv.Sobel(cleaned, gradY, cv.CV_64F, 0, 1, 3);

      cv.convertScaleAbs(gradX, gradX);
      cv.convertScaleAbs(gradY, gradY);
      cv.addWeighted(gradX, 0.5, gradY, 0.5, 0, gradient);

      // ใช้ threshold เพื่อแยกขอบชัดเจน
      const edges = new cv.Mat();
      cv.threshold(gradient, edges, 40, 255, cv.THRESH_BINARY);

      // หา contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      // หาพื้นที่ที่ใหญ่ที่สุดที่น่าจะเป็นรูปถ่าย
      let maxArea = 0;
      let maxContourIndex = -1;
      const minArea = (img.width * img.height) * 0.4; // เพิ่มขนาดขั้นต่ำเป็น 40%

      for (let i = 0; i < contours.size(); i++) {
        const area = cv.contourArea(contours.get(i));
        if (area > minArea) {
          const perimeter = cv.arcLength(contours.get(i), true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contours.get(i), approx, 0.02 * perimeter, true);

          if (approx.rows === 4) {
            const rect = cv.boundingRect(contours.get(i));
            const aspectRatio = rect.width / rect.height;

            // ตรวจสอบอัตราส่วนที่เห้มงวดขึ้น
            if (aspectRatio > 0.75 && aspectRatio < 0.8 && area > maxArea) {
              maxArea = area;
              maxContourIndex = i;
            }
          }
          approx.delete();
        }
      }

      if (maxContourIndex !== -1) {
        // หาจุดมุมที่แม่นยำ
        const contour = contours.get(maxContourIndex);
        const epsilon = 0.02 * cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);

        // เรียงจุดมุม
        const points = [];
        for (let i = 0; i < approx.rows; i++) {
          points.push({
            x: approx.data32S[i * 2],
            y: approx.data32S[i * 2 + 1]
          });
        }

        // เรียงจุดตามตำแหน่ง (บนซ้าย, บนขวา, ล่างขวา, ล่างซ้าย)
        points.sort((a, b) => a.y - b.y);
        const top = points.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = points.slice(2, 4).sort((a, b) => a.x - b.x);
        const orderedPoints = [...top, ...bottom.reverse()];

        // กำหนดขนาดมาตรฐาน
        const width = 413;
        const height = 531;

        // ทำ perspective transform
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2,
          orderedPoints.flatMap(p => [p.x, p.y]));
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          width - 1, 0,
          width - 1, height - 1,
          0, height - 1
        ]);

        const perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
        const transformed = new cv.Mat();
        cv.warpPerspective(src, transformed, perspectiveMatrix, new cv.Size(width, height));

        // ปรับปรุงคุณภาพภาพ
        const enhanced = new cv.Mat();
        cv.convertScaleAbs(transformed, enhanced, 1.2, 5);

        // เพิ่มการตัดขอบเพิ่มเติม
        const cropPadding = 2; // ลดขอบลงอีก 2 พิกเซล
        const roi = new cv.Rect(
          cropPadding,
          cropPadding,
          width - (cropPadding * 2),
          height - (cropPadding * 2)
        );
        const cropped = enhanced.roi(roi);

        // แปลงเป็น Data URL
        const outputCanvas = document.createElement('canvas');
        cv.imshow(outputCanvas, cropped);

        // Clean up
        src.delete();
        gray.delete();
        binary.delete();
        cleaned.delete();
        gradX.delete();
        gradY.delete();
        gradient.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        approx.delete();
        srcPoints.delete();
        dstPoints.delete();
        perspectiveMatrix.delete();
        transformed.delete();
        enhanced.delete();
        cropped.delete();

        resolve(outputCanvas.toDataURL('image/jpeg', 1.0));
      } else {
        resolve(imageData);
      }
    };
    img.src = imageData;
  });
};
</script>

<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- หัวข้อ -->
        <v-card elevation="3" class="rounded-lg">
          <v-card-title class="text-center py-6">
            <v-icon size="36" color="primary" class="mb-3">mdi-face-recognition</v-icon>
            <h2 class="text-h4 font-weight-bold">ระบบตรวจจับใบหน้า</h2>
            <div class="text-subtitle-1 text-medium-emphasis">
              อัพโหลดรูปภาพเพื่อตรวจจับและปรับแต่งรูปถ่าย
            </div>
          </v-card-title>

          <!-- ส่วนอัพโหลดรูปภาพ -->
          <v-card-text>
            <v-row justify="center">
              <v-col cols="12" md="8">
                <v-file-input v-model="file" accept="image/*" @change="processImage"
                  :rules="[v => !!v || 'กรุณาเลือกไฟล์รูปภาพ']" placeholder="เลือกไฟล์รูปภาพที่ต้องการตรวจจับ"
                  prepend-icon="mdi-camera" label="อัพโหลดรูปภาพ" variant="outlined" rounded="lg" show-size
                  class="mb-4" />

                <!-- แสดงรูปภาพที่อัพโหลด -->
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
                        <v-card-title class="text-subtitle-1">ภาพที่ประมวลผลแล้ว</v-card-title>
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

                <!-- ประวัติการประมวลผล -->
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

                <!-- ปุ่มยกเลิก -->
                <v-btn block color="error" variant="outlined" @click="cancel" class="mt-6" rounded="lg"
                  prepend-icon="mdi-close">
                  ยกเลิก
                </v-btn>
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

/* Animation */
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

.v-col {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
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

.v-col:nth-child(1) {
  animation-delay: 0.1s;
}

.v-col:nth-child(2) {
  animation-delay: 0.2s;
}

.v-col:nth-child(3) {
  animation-delay: 0.3s;
}

.detection-container {
  min-height: 100vh;
  background: url('/nyc-aerial-view-new-york-city-night.jpg') no-repeat center center fixed;
  background-size: cover;
  padding: 2rem 0;
}

.detection-card {
  border-radius: 16px;
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
}

.image-card {
  transition: transform 0.3s ease;
  height: 100%;
}

.image-card:hover {
  transform: translateY(-5px);
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

.v-file-input {
  transition: all 0.3s ease;
}

.v-file-input:hover {
  transform: translateY(-2px);
}

.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Animation for image cards */
.v-img {
  transition: all 0.3s ease;
}

.v-img:hover {
  transform: scale(1.05);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #2196f3;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #1976d2;
}

.history-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.history-item {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.history-image {
  border-radius: 8px 8px 0 0;
  transition: transform 0.3s ease;
}

.history-image:hover {
  transform: scale(1.05);
}

/* เพิ่ม Animation สำหรับ Grid Layout */
.v-col {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
}

.v-col:nth-child(1) {
  animation-delay: 0.1s;
}

.v-col:nth-child(2) {
  animation-delay: 0.2s;
}

.v-col:nth-child(3) {
  animation-delay: 0.3s;
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
</style>