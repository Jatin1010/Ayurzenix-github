package in.ayurzenix.app.model

import android.graphics.Bitmap

data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val image: Bitmap? = null,
    val isAnalysisResult: Boolean = false,
    val analysisData: AnalysisResult? = null,
    val isError: Boolean = false,
    val errorImage: Bitmap? = null
)

data class AnalysisResult(
    val observation: String,
    val imbalance: String,
    val wellnessInsight: String,
    val remedies: List<String>,
    val medicines: List<AyurvedicMedicine>
)

data class AyurvedicMedicine(
    val name: String,
    val benefit: String,
    val amazonLink: String,
    val imageUrl: String? = null,
    val rating: Float = 4.5f,
    val reviewCount: Int = 120,
    val price: String? = "₹299",
    val mrp: String? = "₹499"
)

data class DailyRoutine(
    val quiz: List<QuizQuestion>,
    val targets: List<HealthTarget>,
    val tasks: List<ActionableHabit>
)

data class QuizQuestion(
    val question: String,
    var isAnswered: Boolean = false,
    var answer: Boolean? = null
)

data class HealthTarget(
    val target: String,
    var isCompleted: Boolean = false
)

data class ActionableHabit(
    val habit: String,
    var isCompleted: Boolean = false
)
