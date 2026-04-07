package in.ayurzenix.app.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query

class WalletViewModel : ViewModel() {

    private val _balance = MutableLiveData<Int>(0)
    val balance: LiveData<Int> = _balance

    private val _transactions = MutableLiveData<List<Map<String, Any>>>()
    val transactions: LiveData<List<Map<String, Any>>> = _transactions

    private val db = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    init {
        fetchWalletData()
    }

    private fun fetchWalletData() {
        val uid = auth.currentUser?.uid ?: return
        
        db.collection("users").document(uid).addSnapshotListener { snapshot, _ ->
            if (snapshot != null && snapshot.exists()) {
                _balance.value = snapshot.getLong("wallet_balance")?.toInt() ?: 0
            }
        }

        db.collection("transactions")
            .whereEqualTo("uid", uid)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, _ ->
                if (snapshot != null) {
                    _transactions.value = snapshot.documents.map { it.data ?: emptyMap() }
                }
            }
    }

    fun processPayment(paymentId: String, amount: Int) {
        val uid = auth.currentUser?.uid ?: return
        val userRef = db.collection("users").document(uid)
        
        db.runTransaction { transaction ->
            val snapshot = transaction.get(userRef)
            val currentBalance = snapshot.getLong("wallet_balance") ?: 0
            transaction.update(userRef, "wallet_balance", currentBalance + amount)
            
            val txData = hashMapOf(
                "uid" to uid,
                "amount" to amount,
                "type" to "recharge",
                "status" to "success",
                "razorpay_payment_id" to paymentId,
                "createdAt" to com.google.firebase.Timestamp.now()
            )
            transaction.set(db.collection("transactions").document(paymentId), txData)
        }.addOnSuccessListener {
            // Success
        }
    }
}
