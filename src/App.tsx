import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ChevronRight, 
  ChevronLeft, 
  Utensils, 
  Droplets, 
  Dumbbell, 
  CheckCircle2, 
  Loader2,
  Apple,
  ArrowRight,
  Info,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { UserProfile, NutritionPlan, Meal } from './types';
import { generateNutritionPlan, regenerateMeal } from './services/gemini';

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    gender: 'female',
    height: 160,
    weight: 60,
    goalWeight: 55,
    activityLevel: 'moderate',
    eatingHabits: '',
    allergies: '',
    preferredProteins: '',
    preferredVegetables: ''
  });

  const calculateBMR = (p: UserProfile) => {
    // Mifflin-St Jeor Equation
    if (p.gender === 'male') {
      return 10 * p.weight + 6.25 * p.height - 5 * p.age + 5;
    }
    return 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  };

  const getActivityMultiplier = (level: string) => {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return multipliers[level as keyof typeof multipliers] || 1.2;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const bmr = calculateBMR(profile);
      const tdee = bmr * getActivityMultiplier(profile.activityLevel);
      const target = tdee - 400; // Aim for 400 kcal deficit
      
      const result = await generateNutritionPlan(profile, Math.round(bmr), Math.round(tdee), Math.round(target));
      setPlan(result);
      setStep(3);
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const [swappingMeal, setSwappingMeal] = useState<{day: number, mealType: string} | null>(null);

  const handleSwapMeal = async (day: number, mealType: string, currentMeal: Meal) => {
    const request = prompt(`Bạn muốn thay đổi món "${currentMeal.name}" như thế nào? (Ví dụ: Thay thịt bằng đậu phụ, không ăn rau muống...)`);
    if (!request) return;

    setLoading(true);
    try {
      const newMeal = await regenerateMeal(currentMeal, request, profile);
      if (plan) {
        const newWeeklyPlan = plan.weeklyPlan.map(d => {
          if (d.day === day) {
            return { ...d, [mealType]: newMeal };
          }
          return d;
        });
        setPlan({ ...plan, weeklyPlan: newWeeklyPlan });
      }
    } catch (error) {
      console.error("Error swapping meal:", error);
      alert("Có lỗi xảy ra khi thay đổi món ăn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D3436] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Apple size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-emerald-900">NutriPlan</span>
          </div>
          <div className="text-xs font-medium uppercase tracking-widest text-gray-400">
            Chuyên Gia Dinh Dưỡng Số
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-emerald-950 mb-4 tracking-tight">Bắt đầu hành trình của bạn</h1>
                <p className="text-gray-500 text-lg">Cung cấp thông tin cơ bản để chúng tôi tính toán nhu cầu dinh dưỡng của bạn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Tuổi</label>
                  <input 
                    type="number" 
                    value={profile.age}
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Giới tính</label>
                  <div className="flex gap-2">
                    {['male', 'female'].map(g => (
                      <button
                        key={g}
                        onClick={() => setProfile({...profile, gender: g as any})}
                        className={`flex-1 py-3 rounded-xl border transition-all font-medium ${profile.gender === g ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-200'}`}
                      >
                        {g === 'male' ? 'Nam' : 'Nữ'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Chiều cao (cm)</label>
                  <input 
                    type="number" 
                    value={profile.height}
                    onChange={e => setProfile({...profile, height: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cân nặng hiện tại (kg)</label>
                  <input 
                    type="number" 
                    value={profile.weight}
                    onChange={e => setProfile({...profile, weight: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Mục tiêu cân nặng (kg)</label>
                  <input 
                    type="number" 
                    value={profile.goalWeight}
                    onChange={e => setProfile({...profile, goalWeight: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Mức độ vận động</label>
                  <select 
                    value={profile.activityLevel}
                    onChange={e => setProfile({...profile, activityLevel: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                  >
                    <option value="sedentary">Ít vận động</option>
                    <option value="light">Vận động nhẹ</option>
                    <option value="moderate">Vận động trung bình</option>
                    <option value="active">Vận động nhiều</option>
                    <option value="very_active">Vận động rất nhiều</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  className="group flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Tiếp tục
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-emerald-950 mb-4 tracking-tight">Thói quen & Sở thích</h1>
                <p className="text-gray-500 text-lg">Giúp chúng tôi cá nhân hóa thực đơn phù hợp với khẩu vị của bạn.</p>
              </div>

              <div className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Utensils size={16} className="text-emerald-500" />
                    Thói quen ăn uống hiện tại
                  </label>
                  <textarea 
                    placeholder="Ví dụ: Thích ăn cơm, hay ăn vặt buổi chiều, thích đồ cay..."
                    value={profile.eatingHabits}
                    onChange={e => setProfile({...profile, eatingHabits: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Utensils size={16} className="text-emerald-500" />
                    Loại đạm ưu tiên (Thịt, cá, trứng, đậu...)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: Thích ức gà, bò, cá hồi..."
                    value={profile.preferredProteins}
                    onChange={e => setProfile({...profile, preferredProteins: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Apple size={16} className="text-emerald-500" />
                    Loại rau ưu tiên
                  </label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: Súp lơ, xà lách, cải bó xôi..."
                    value={profile.preferredVegetables}
                    onChange={e => setProfile({...profile, preferredVegetables: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Info size={16} className="text-rose-500" />
                    Dị ứng hoặc thực phẩm cần tránh
                  </label>
                  <textarea 
                    placeholder="Ví dụ: Dị ứng hải sản, không ăn được hành, không thích mướp đắng..."
                    value={profile.allergies}
                    onChange={e => setProfile({...profile, allergies: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-500 font-bold hover:text-emerald-600 transition-colors"
                >
                  <ChevronLeft />
                  Quay lại
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="group flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      Tạo kế hoạch
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && plan && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Calculator size={20} />
                    </div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">TDEE</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{plan.tdee} <span className="text-lg font-normal text-gray-400">kcal</span></div>
                  <p className="text-xs text-gray-400 mt-2">Năng lượng tiêu thụ hàng ngày</p>
                </div>
                <div className="bg-emerald-900 p-6 rounded-3xl shadow-xl shadow-emerald-100 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 text-emerald-400 rounded-lg">
                      <Calculator size={20} />
                    </div>
                    <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Mục tiêu</span>
                  </div>
                  <div className="text-3xl font-bold">{plan.targetCalories} <span className="text-lg font-normal text-emerald-300">kcal</span></div>
                  <p className="text-xs text-emerald-300 mt-2">Năng lượng nạp vào để giảm cân</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                      <Calculator size={20} />
                    </div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Thâm hụt</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{plan.tdee - plan.targetCalories} <span className="text-lg font-normal text-gray-400">kcal</span></div>
                  <p className="text-xs text-gray-400 mt-2">Mức thâm hụt an toàn mỗi ngày</p>
                </div>
              </div>

              {/* Weekly Plan */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-emerald-950 tracking-tight">Thực đơn 7 ngày</h2>
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                    <CheckCircle2 size={16} />
                    Giàu Protein & Chất xơ
                  </div>
                </div>

                <div className="space-y-8">
                  {plan.weeklyPlan.map((day) => (
                    <div key={day.day} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xl font-bold text-emerald-900">Ngày {day.day}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thực đơn chi tiết</span>
                      </div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                          { label: 'Bữa sáng', type: 'breakfast', data: day.breakfast, color: 'bg-orange-50 text-orange-700' },
                          { label: 'Bữa trưa', type: 'lunch', data: day.lunch, color: 'bg-blue-50 text-blue-700' },
                          { label: 'Bữa phụ', type: 'snack', data: day.snack, color: 'bg-purple-50 text-purple-700' },
                          { label: 'Bữa tối', type: 'dinner', data: day.dinner, color: 'bg-emerald-50 text-emerald-700' }
                        ].map((meal, idx) => (
                          <div key={idx} className="space-y-4 group/meal relative">
                            <div className="flex items-center justify-between">
                              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${meal.color}`}>
                                {meal.label}
                              </div>
                              <button 
                                onClick={() => handleSwapMeal(day.day, meal.type, meal.data as Meal)}
                                className="opacity-0 group-hover/meal:opacity-100 p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-emerald-600"
                                title="Thay đổi món này"
                              >
                                <RefreshCw size={14} />
                              </button>
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{meal.data?.name}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{meal.data?.description}</p>
                            <div className="pt-4 space-y-2 border-t border-gray-50">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="font-medium text-gray-400">Đạm:</span>
                                <span className="text-gray-700">{meal.data?.proteinSource}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                <span className="font-medium text-gray-400">Xơ:</span>
                                <span className="text-gray-700">{meal.data?.fiberSource}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                <span className="font-medium text-gray-400">Carb:</span>
                                <span className="text-gray-700">{meal.data?.carbSource}</span>
                              </div>
                              {meal.data?.backupMeal && (
                                <div className="mt-3 p-2 bg-rose-50 rounded-lg border border-rose-100">
                                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Dự phòng (Thay cá)</p>
                                  <p className="text-xs font-bold text-gray-800">{meal.data.backupMeal.name}</p>
                                  <p className="text-[10px] text-gray-500">Đạm: {meal.data.backupMeal.proteinSource}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Utensils size={24} />
                    </div>
                    <h3 className="font-bold text-xl">Thói quen ăn uống</h3>
                  </div>
                  <ul className="space-y-4">
                    {plan.tips.eatingHabits.map((habit, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                        <span className="text-emerald-500 font-bold">•</span>
                        {habit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Droplets size={24} />
                    </div>
                    <h3 className="font-bold text-xl">Lượng nước</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {plan.tips.waterIntake}
                  </p>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 italic">
                      "Uống một cốc nước trước bữa ăn 30 phút giúp kiểm soát cơn đói tốt hơn."
                    </p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                      <Dumbbell size={24} />
                    </div>
                    <h3 className="font-bold text-xl">Luyện tập</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {plan.tips.workoutSchedule}
                  </p>
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-xs font-medium text-orange-700 italic">
                      "Ưu tiên các bài tập kháng lực (tạ, bodyweight) để giữ cơ bắp khi giảm cân."
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => {
                    setStep(1);
                    setPlan(null);
                  }}
                  className="text-gray-400 font-bold hover:text-emerald-600 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft />
                  Tạo kế hoạch mới
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">
          © 2026 NutriPlan. Được thiết kế dựa trên các nguyên tắc dinh dưỡng khoa học.
          <br />
          Lưu ý: Luôn tham khảo ý kiến bác sĩ trước khi bắt đầu bất kỳ chế độ ăn kiêng nào.
        </p>
      </footer>
    </div>
  );
}
