package in.ayurzenix.app.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import in.ayurzenix.app.databinding.LayoutPermissionBottomSheetBinding

class PermissionBottomSheetFragment(
    private val title: String,
    private val description: String,
    private val iconRes: Int,
    private val onAllow: () -> Unit,
    private val onNotNow: () -> Unit = {}
) : BottomSheetDialogFragment() {

    private var _binding: LayoutPermissionBottomSheetBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = LayoutPermissionBottomSheetBinding.inflate(inflater, container, false)
        
        binding.tvPermissionTitle.text = title
        binding.tvPermissionDescription.text = description
        binding.ivPermissionIcon.setImageResource(iconRes)

        binding.btnAllow.setOnClickListener {
            onAllow()
            dismiss()
        }

        binding.btnNotNow.setOnClickListener {
            onNotNow()
            dismiss()
        }

        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "PermissionBottomSheet"
    }
}
