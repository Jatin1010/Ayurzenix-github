package in.ayurzenix.app.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class HomeViewModel : ViewModel() {

    private val _userName = MutableLiveData<String>("User")
    val userName: LiveData<String> = _userName

    private val _walletBalance = MutableLiveData<Int>(0)
    val walletBalance: LiveData<Int> = _walletBalance

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    init {
        fetchUserData()
    }

    private fun fetchUserData() {
        val uid = auth.currentUser?.uid ?: return
        db.collection("users").document(uid).addSnapshotListener { snapshot, _ ->
            if (snapshot != null && snapshot.exists()) {
                _userName.value = snapshot.getString("name") ?: "User"
                _walletBalance.value = snapshot.getLong("wallet_balance")?.toInt() ?: 0
            }
        }
    }

    fun generateAmazonLink(medicineName: String): String {
        return "https://www.amazon.in/s?k=${medicineName}&tag=goldify00-21"
    }
}
