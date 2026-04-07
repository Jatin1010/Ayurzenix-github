package in.ayurzenix.app.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import in.ayurzenix.app.model.ActionableHabit
import in.ayurzenix.app.model.DailyRoutine
import in.ayurzenix.app.model.HealthTarget
import in.ayurzenix.app.model.QuizQuestion
import kotlinx.coroutines.launch
import org.json.JSONObject

class DailyRoutineViewModel : ViewModel() {

    private val _routine = MutableLiveData<DailyRoutine?>()
    val routine: LiveData<DailyRoutine?> = _routine

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _progress = MutableLiveData<Int>(0)
    val progress: LiveData<Int> = _progress

    private val generativeModel = GenerativeModel(
        modelName = "gemini-3.1-pro-preview",
        apiKey = "YOUR_GEMINI_API_KEY",
        systemInstruction = content { text("You are an Ayurvedic wellness expert. Generate a daily routine for a user. Output ONLY a JSON object with fields: quiz (list of 3 simple yes/no questions), targets (list of 3 health goals), and tasks (list of 3 actionable habits). Keep it simple, practical, and beginner-friendly.") }
    )

    fun generateDailyRoutine() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val prompt = "Generate a personalized Ayurvedic daily routine for today."
                val response = generativeModel.generateContent(prompt)
                val jsonStr = response.text?.trim() ?: "{}"
                
                val cleanJson = if (jsonStr.contains("```json")) {
                    jsonStr.substringAfter("```json").substringBefore("```").trim()
                } else if (jsonStr.contains("```")) {
                    jsonStr.substringAfter("```").substringBefore("```").trim()
                } else {
                    jsonStr.trim()
                }

                val json = JSONObject(cleanJson)
                
                val quizArray = json.getJSONArray("quiz")
                val quiz = mutableListOf<QuizQuestion>()
                for (i in 0 until quizArray.length()) {
                    quiz.add(QuizQuestion(quizArray.getString(i)))
                }

                val targetsArray = json.getJSONArray("targets")
                val targets = mutableListOf<HealthTarget>()
                for (i in 0 until targetsArray.length()) {
                    targets.add(HealthTarget(targetsArray.getString(i)))
                }

                val tasksArray = json.getJSONArray("tasks")
                val tasks = mutableListOf<ActionableHabit>()
                for (i in 0 until tasksArray.length()) {
                    tasks.add(ActionableHabit(tasksArray.getString(i)))
                }

                _routine.value = DailyRoutine(quiz, targets, tasks)
                calculateProgress()
            } catch (e: Exception) {
                // Fallback to static routine if AI fails
                _routine.value = DailyRoutine(
                    listOf(QuizQuestion("Did you drink warm water today?"), QuizQuestion("How was your sleep?")),
                    listOf(HealthTarget("Drink 8 glasses of water"), HealthTarget("Walk 5000 steps")),
                    listOf(ActionableHabit("Drink turmeric water"), ActionableHabit("Do 10 min breathing"))
                )
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun updateQuizAnswer(index: Int, answer: Boolean) {
        val currentRoutine = _routine.value ?: return
        currentRoutine.quiz[index].isAnswered = true
        currentRoutine.quiz[index].answer = answer
        _routine.value = currentRoutine
        calculateProgress()
    }

    fun toggleTarget(index: Int) {
        val currentRoutine = _routine.value ?: return
        currentRoutine.targets[index].isCompleted = !currentRoutine.targets[index].isCompleted
        _routine.value = currentRoutine
        calculateProgress()
    }

    fun toggleTask(index: Int) {
        val currentRoutine = _routine.value ?: return
        currentRoutine.tasks[index].isCompleted = !currentRoutine.tasks[index].isCompleted
        _routine.value = currentRoutine
        calculateProgress()
    }

    private fun calculateProgress() {
        val routine = _routine.value ?: return
        val totalItems = routine.quiz.size + routine.targets.size + routine.tasks.size
        if (totalItems == 0) {
            _progress.value = 0
            return
        }
        
        val completedItems = routine.quiz.count { it.isAnswered } +
                routine.targets.count { it.isCompleted } +
                routine.tasks.count { it.isCompleted }
        
        _progress.value = (completedItems * 100) / totalItems
    }
}
