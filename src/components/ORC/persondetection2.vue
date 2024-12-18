<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const file = ref<File | null>(null);
const processedImage = ref<string | null>(null);
const originalFile = ref<string | null>(null);
const originalImage = ref<HTMLImageElement | null>(null);
const errorMessage = ref<string>("");
const isProcessing = ref<boolean>(false);

// โหลดโมเดลที่จำเป็น
const loadModels = async () => {
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await tf.ready();
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet
  );
  const objectDetector = await cocoSsd.load();
  return { detector, objectDetector };
};

onMounted(async () => {
  await loadModels();
});

// ฟังก์ชันตรวจสอบรูปถ่ายทางการ
const detectFormalPhoto = async (image: HTMLImageElement) => {
  // ตรวจจับใบหน้า
  const faceDetection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks();
    
  if (!faceDetection) {
    return { isFormal: false, reason: "ไม่พบใบหน้าในภาพ" };
  }

  // ตรวจจับวัตถุและเสื้อผ้า
  const { objectDetector } = await loadModels();
  const objects = await objectDetector.detect(image);
  
  const hasProperClothing = objects.some(obj => 
    ["person", "tie", "suit", "shirt"].includes(obj.class)
  );

  if (!hasProperClothing) {
    return { isFormal: false, reason: "ไม่พบการแต่งกายที่เป็นทางการ" };
  }

  // ตรวจสอบท่าทาง
  const { detector } = await loadModels();
  const poses = await detector.estimatePoses(image);
  
  if (poses.length > 0) {
    const pose = poses[0];
    // ตรวจสอบว่าหันหน้าตรง
    const isFrontFacing = checkFrontFacingPose(pose);
    if (!isFrontFacing) {
      return { isFormal: false, reason: "ท่าทางไม่เหมาะสมสำหรับรูปถ่ายทางการ" };
    }
  }

  // ตรวจสอบฉากหลัง
  const isBackgroundPlain = await checkPlainBackground(image);
  if (!isBackgroundPlain) {
    return { isFormal: false, reason: "ฉากหลังไม่เรียบง่าย" };
  }

  return { isFormal: true, reason: "รูปถ่ายเป็นไปตามมาตรฐานทางการ" };
};

// ฟังก์ชันตรวจสอบท่าทางการหันหน้า
const checkFrontFacingPose = (pose: any) => {
  const keypoints = pose.keypoints;
  // ตรวจสอบความสมมาตรของจุดสำคัญบนใบหน้า
  const leftEye = keypoints.find((kp: any) => kp.name === "left_eye");
  const rightEye = keypoints.find((kp: any) => kp.name === "right_eye");
  
  if (leftEye && rightEye) {
    const eyeDistance = Math.abs(leftEye.x - rightEye.x);
    // ถ้าระยะห่างระหว่างตาใกล้เคียงกัน แสดงว่าหันหน้าตรง
    return eyeDistance > 20;
  }
  return false;
};

// ฟังก์ชันตรวจสอบฉากหลัง
const checkPlainBackground = async (image: HTMLImageElement) => {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // ตรวจสอบความแปรปรวนของสี
  let colorVariance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    colorVariance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
  }

  const averageVariance = colorVariance / (data.length / 4);
  // ถ้าความแปรปรวนต่ำ แสดงว่าฉากหลังเรียบง่าย
  return averageVariance < 30;
};

// ฟังก์ชันจัดการการอัปโหลดไฟล์
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    file.value = input.files[0];
    originalFile.value = URL.createObjectURL(input.files[0]);
    processImage(input.files[0]);
  }
};

// ฟังก์ชันประมวลผลภาพ
const processImage = async (file: File) => {
  try {
    isProcessing.value = true;
    errorMessage.value = "";
    
    const image = new Image();
    image.src = URL.createObjectURL(file);
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const result = await detectFormalPhoto(image);
    if (result.isFormal) {
      processedImage.value = image.src;
      errorMessage.value = result.reason;
    } else {
      processedImage.value = null;
      errorMessage.value = result.reason;
    }
  } catch (error) {
    errorMessage.value = "เกิดข้อผิดพลาดในการประมวลผลภาพ";
    console.error(error);
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="max-w-xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">ตรวจสอบรูปถ่ายทางการ</h1>
      
      <!-- อัปโหลดรูปภาพ -->
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">
          เลือกรูปภาพ
        </label>
        <input
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          class="shadow border rounded w-full py-2 px-3"
        >
      </div>

      <!-- แสดงสถานะการประมวลผล -->
      <div v-if="isProcessing" class="text-center my-4">
        <p>กำลังประมวลผล...</p>
      </div>

      <!-- แสดงข้อความแจ้งเตือน -->
      <div v-if="errorMessage" class="my-4 p-4 rounded" :class="processedImage ? 'bg-green-100' : 'bg-red-100'">
        {{ errorMessage }}
      </div>

      <!-- แสดงรูปภาพ -->
      <div class="grid grid-cols-2 gap-4">
        <div v-if="originalFile">
          <h3 class="font-bold mb-2">รูปภาพต้นฉบับ</h3>
          <img :src="originalFile" class="max-w-full h-auto rounded">
        </div>
        <div v-if="processedImage">
          <h3 class="font-bold mb-2">รูปภาพที่ผ่านการตรวจสอบ</h3>
          <img :src="processedImage" class="max-w-full h-auto rounded">
        </div>
      </div>
    </div>
  </div>
</template>
