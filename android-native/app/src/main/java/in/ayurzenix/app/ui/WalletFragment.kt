package in.ayurzenix.app.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import in.ayurzenix.app.databinding.FragmentWalletBinding
import in.ayurzenix.app.viewmodel.WalletViewModel

class WalletFragment : Fragment() {

    private var _binding: FragmentWalletBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: WalletViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWalletBinding.inflate(inflater, container, false)
        viewModel = ViewModelProvider(this).get(WalletViewModel::class.java)

        setupUI()
        observeViewModel()

        return binding.root
    }

    private fun setupUI() {
        binding.btnRecharge.setOnClickListener {
            // Razorpay logic would go here
        }
    }

    private fun observeViewModel() {
        viewModel.balance.observe(viewLifecycleOwner) { balance ->
            binding.tvWalletBalance.text = "₹$balance"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
