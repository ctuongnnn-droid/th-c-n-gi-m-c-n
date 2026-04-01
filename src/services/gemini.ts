import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, NutritionPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateNutritionPlan(profile: UserProfile, bmr: number, tdee: number, targetCalories: number): Promise<NutritionPlan> {
  const prompt = `
    Bạn là một chuyên gia dinh dưỡng với hơn 10 năm kinh nghiệm. 
    Hãy thiết kế một kế hoạch giảm cân khoa học cho người dùng với thông tin sau:
    - Tuổi: ${profile.age}
    - Giới tính: ${profile.gender === 'male' ? 'Nam' : 'Nữ'}
    - Chiều cao: ${profile.height}cm
    - Cân nặng hiện tại: ${profile.weight}kg
    - Mục tiêu: ${profile.goalWeight}kg
    - Mức độ vận động: ${profile.activityLevel}
    - Thói quen ăn uống: ${profile.eatingHabits}
    - Dị ứng/Kiêng kỵ: ${profile.allergies}
    - Loại đạm ưu tiên: ${profile.preferredProteins}
    - Loại rau ưu tiên: ${profile.preferredVegetables}
    
    Các chỉ số đã tính toán:
    - BMR: ${bmr} kcal
    - TDEE: ${tdee} kcal
    - Calo mục tiêu (giảm 300-500 kcal): ${targetCalories} kcal
    
    Yêu cầu:
    1. Tạo thực đơn 7 ngày chi tiết (3 bữa chính + 1 bữa phụ).
    2. Mỗi bữa ăn phải giàu protein, nhiều xơ, tinh bột phức (gạo lứt, yến mạch, khoai lang).
    3. Thực phẩm phải phổ biến ở Việt Nam, dễ tìm, dễ nấu.
    4. Cung cấp lời khuyên về thói quen ăn uống, lượng nước và lịch tập luyện.
    5. ĐẶC BIỆT: Đối với bất kỳ bữa ăn nào có món CÁ, hãy cung cấp thêm một "backupMeal" (thực đơn dự phòng) sử dụng nguồn đạm khác (như ức gà, đậu phụ hoặc trứng) để người dùng thay thế nếu không thích cá hoặc không mua được cá.
    
    Trả về kết quả dưới dạng JSON theo cấu trúc:
    {
      "bmr": number,
      "tdee": number,
      "targetCalories": number,
      "weeklyPlan": [
        {
          "day": number,
          "breakfast": { "name": string, "description": string, "proteinSource": string, "fiberSource": string, "carbSource": string },
          "lunch": { "name": string, "description": string, "proteinSource": string, "fiberSource": string, "carbSource": string },
          "dinner": { "name": string, "description": string, "proteinSource": string, "fiberSource": string, "carbSource": string },
          "snack": { "name": string, "description": string, "proteinSource": string, "fiberSource": string, "carbSource": string }
        }
      ],
      "tips": {
        "eatingHabits": string[],
        "waterIntake": string,
        "workoutSchedule": string
      }
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bmr: { type: Type.NUMBER },
          tdee: { type: Type.NUMBER },
          targetCalories: { type: Type.NUMBER },
          weeklyPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                breakfast: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    proteinSource: { type: Type.STRING },
                    fiberSource: { type: Type.STRING },
                    carbSource: { type: Type.STRING },
                    backupMeal: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        proteinSource: { type: Type.STRING }
                      }
                    }
                  }
                },
                lunch: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    proteinSource: { type: Type.STRING },
                    fiberSource: { type: Type.STRING },
                    carbSource: { type: Type.STRING },
                    backupMeal: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        proteinSource: { type: Type.STRING }
                      }
                    }
                  }
                },
                dinner: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    proteinSource: { type: Type.STRING },
                    fiberSource: { type: Type.STRING },
                    carbSource: { type: Type.STRING },
                    backupMeal: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        proteinSource: { type: Type.STRING }
                      }
                    }
                  }
                },
                snack: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    proteinSource: { type: Type.STRING },
                    fiberSource: { type: Type.STRING },
                    carbSource: { type: Type.STRING }
                  }
                }
              }
            }
          },
          tips: {
            type: Type.OBJECT,
            properties: {
              eatingHabits: { type: Type.ARRAY, items: { type: Type.STRING } },
              waterIntake: { type: Type.STRING },
              workoutSchedule: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function regenerateMeal(currentMeal: any, request: string, profile: UserProfile): Promise<any> {
  const prompt = `
    Bạn là một chuyên gia dinh dưỡng. Người dùng muốn thay đổi một bữa ăn trong thực đơn giảm cân của họ.
    Bữa ăn hiện tại:
    - Tên: ${currentMeal.name}
    - Mô tả: ${currentMeal.description}
    - Đạm: ${currentMeal.proteinSource}
    - Xơ: ${currentMeal.fiberSource}
    - Carb: ${currentMeal.carbSource}
    
    Yêu cầu thay đổi của người dùng: "${request}"
    
    Hãy tạo một bữa ăn mới thay thế bữa ăn này, đảm bảo:
    1. Tuân thủ yêu cầu thay đổi của người dùng.
    2. Vẫn đảm bảo nguyên tắc giảm cân (giàu đạm, nhiều xơ, carb phức).
    3. Phù hợp với thông tin người dùng: Dị ứng (${profile.allergies}), Ưu tiên đạm (${profile.preferredProteins}), Ưu tiên rau (${profile.preferredVegetables}).
    
    Trả về kết quả dưới dạng JSON:
    {
      "name": string,
      "description": string,
      "proteinSource": string,
      "fiberSource": string,
      "carbSource": string,
      "backupMeal": { "name": string, "proteinSource": string } // Chỉ có nếu món mới là cá
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          proteinSource: { type: Type.STRING },
          fiberSource: { type: Type.STRING },
          carbSource: { type: Type.STRING },
          backupMeal: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              proteinSource: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
