package in.ayurzenix.app.viewmodel

import android.graphics.Bitmap
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import in.ayurzenix.app.model.AnalysisResult
import in.ayurzenix.app.model.AyurvedicMedicine
import in.ayurzenix.app.model.ChatMessage
import kotlinx.coroutines.launch
import org.json.JSONObject

class ChatViewModel : ViewModel() {

    private val _messages = MutableLiveData<List<ChatMessage>>(listOf(
        ChatMessage("Namaste! 🙏 I am your Ayurvedic AI Assistant, **Ayurzenix**. How can I help you achieve balance today? ✨", false)
    ))
    val messages: LiveData<List<ChatMessage>> = _messages

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _insufficientBalance = MutableLiveData<Boolean>(false)
    val insufficientBalance: LiveData<Boolean> = _insufficientBalance

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    private val generativeModel = GenerativeModel(
        modelName = "gemini-3.1-pro-preview",
        apiKey = "YOUR_GEMINI_API_KEY",
        systemInstruction = content { text("You are Ayurzenix, an expert Ayurvedic AI. For ANY health-related query, symptom analysis, or image analysis, provide a structured JSON response with fields: observation, imbalance, wellnessInsight, remedies (list), and medicines (list of objects with name, benefit, amazonLink, imageUrl, rating, reviewCount, price, mrp). If the query is a simple greeting or non-health related, you can respond with plain text, but for any advice or analysis, ALWAYS use the JSON format. Use soft language like 'may', 'could be', 'suggested'. Avoid medical diagnosis.") }
    )

    fun analyzeImage(image: Bitmap) {
        val uid = auth.currentUser?.uid ?: return
        val userRef = db.collection("users").document(uid)

        _isLoading.value = true
        userRef.get().addOnSuccessListener { snapshot ->
            val balance = snapshot.getLong("wallet_balance") ?: 0
            if (balance < 20) {
                _insufficientBalance.value = true
                _isLoading.value = false
            } else {
                // Deduct ₹20 and proceed
                db.runTransaction { transaction ->
                    transaction.update(userRef, "wallet_balance", balance - 20)
                }.addOnSuccessListener {
                    performImageAnalysis(image)
                }
            }
        }
    }

    private fun performImageAnalysis(image: Bitmap) {
        val prompt = """
            Analyze this image (skin, tongue, hair, etc.) and provide Ayurvedic wellness insights.
            Output ONLY a JSON object in this format:
            {
              "observation": "...",
              "imbalance": "...",
              "wellnessInsight": "...",
              "remedies": ["...", "..."],
              "medicines": [
                {
                  "name": "...", 
                  "benefit": "...", 
                  "amazonLink": "https://www.amazon.in/s?k={medicine-name}&tag=goldify00-21",
                  "imageUrl": "https://picsum.photos/seed/{medicine-name}/200/200",
                  "rating": 4.8,
                  "reviewCount": 245,
                  "price": "₹349",
                  "mrp": "₹599"
                }
              ]
            }
            Ensure the tone is informational and uses soft language.
        """.trimIndent()

        viewModelScope.launch {
            try {
                val inputContent = content {
                    image(image)
                    text(prompt)
                }

                val response = generativeModel.generateContent(inputContent)
                val jsonStr = response.text?.trim() ?: "{}"
                val result = parseAnalysisResult(jsonStr)

                val currentMessages = _messages.value.orEmpty().toMutableList()
                currentMessages.add(ChatMessage("Image Analysis Result", false, isAnalysisResult = true, analysisData = result))
                _messages.value = currentMessages
            } catch (e: Exception) {
                val currentMessages = _messages.value.orEmpty().toMutableList()
                currentMessages.add(ChatMessage("Sorry, I encountered an error during image analysis. 🛑", false, isError = true, errorImage = image))
                _messages.value = currentMessages
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun parseAnalysisResult(jsonStr: String): AnalysisResult {
        val cleanJson = if (jsonStr.contains("```json")) {
            jsonStr.substringAfter("```json").substringBefore("```").trim()
        } else if (jsonStr.contains("```")) {
            jsonStr.substringAfter("```").substringBefore("```").trim()
        } else {
            jsonStr.trim()
        }

        val json = JSONObject(cleanJson)
        val medicinesArray = json.getJSONArray("medicines")
        val medicines = mutableListOf<AyurvedicMedicine>()
        for (i in 0 until medicinesArray.length()) {
            val medJson = medicinesArray.getJSONObject(i)
            medicines.add(AyurvedicMedicine(
                medJson.getString("name"),
                medJson.getString("benefit"),
                medJson.getString("amazonLink"),
                medJson.optString("imageUrl"),
                medJson.optDouble("rating", 4.5).toFloat(),
                medJson.optInt("reviewCount", 120),
                medJson.optString("price", "₹299"),
                medJson.optString("mrp", "₹499")
            ))
        }

        val remediesArray = json.getJSONArray("remedies")
        val remedies = mutableListOf<String>()
        for (i in 0 until remediesArray.length()) {
            remedies.add(remediesArray.getString(i))
        }

        return AnalysisResult(
            json.getString("observation"),
            json.getString("imbalance"),
            json.getString("wellnessInsight"),
            remedies,
            medicines
        )
    }

    fun sendMessage(text: String, image: Bitmap? = null) {
        val currentMessages = _messages.value.orEmpty().toMutableList()
        currentMessages.add(ChatMessage(text, true, image = image))
        _messages.value = currentMessages
        _isLoading.value = true

        viewModelScope.launch {
            try {
                val inputContent = content {
                    if (image != null) {
                        image(image)
                    }
                    text(text)
                }

                val response = generativeModel.generateContent(inputContent)
                val aiText = response.text ?: "I apologize, I could not process that."
                
                val updatedMessages = _messages.value.orEmpty().toMutableList()
                
                try {
                    // Try to parse as analysis result
                    val result = parseAnalysisResult(aiText)
                    updatedMessages.add(ChatMessage("Analysis Result", false, isAnalysisResult = true, analysisData = result))
                } catch (e: Exception) {
                    // Fallback to plain text
                    updatedMessages.add(ChatMessage(aiText, false))
                }
                
                _messages.value = updatedMessages
                saveChatToFirestore(text, aiText, image != null)
            } catch (e: Exception) {
                val updatedMessages = _messages.value.orEmpty().toMutableList()
                updatedMessages.add(ChatMessage("Sorry, I encountered an error. Please try again. 🛑", false))
                _messages.value = updatedMessages
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun saveChatToFirestore(userText: String, aiText: String, hasImage: Boolean) {
        val uid = auth.currentUser?.uid ?: return
        val chatData = hashMapOf(
            "uid" to uid,
            "user_message" to userText,
            "ai_message" to aiText,
            "has_image" to hasImage,
            "timestamp" to com.google.firebase.Timestamp.now()
        )
        db.collection("chats").add(chatData)
    }
}
