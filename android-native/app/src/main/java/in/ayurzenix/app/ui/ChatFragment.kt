package in.ayurzenix.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import in.ayurzenix.app.R
import in.ayurzenix.app.adapter.ChatAdapter
import in.ayurzenix.app.databinding.FragmentChatBinding
import in.ayurzenix.app.viewmodel.ChatViewModel

class ChatFragment : Fragment() {

    private var _binding: FragmentChatBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: ChatViewModel
    private lateinit var adapter: ChatAdapter
    private var selectedBitmap: Bitmap? = null

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            launchCamera()
        } else {
            handlePermissionDenied(Manifest.permission.CAMERA)
        }
    }

    private val galleryPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            pickImage.launch("image/*")
        } else {
            handlePermissionDenied(getGalleryPermission())
        }
    }

    private val takePhotoLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val imageBitmap = result.data?.extras?.get("data") as? Bitmap
            imageBitmap?.let {
                selectedBitmap = it
                binding.ivPreview.setImageBitmap(it)
                binding.cardImagePreview.visibility = View.VISIBLE
            }
        }
    }

    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            try {
                val bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    val source = ImageDecoder.createSource(requireContext().contentResolver, it)
                    ImageDecoder.decodeBitmap(source)
                } else {
                    MediaStore.Images.Media.getBitmap(requireContext().contentResolver, it)
                }
                selectedBitmap = bitmap
                binding.ivPreview.setImageBitmap(bitmap)
                binding.cardImagePreview.visibility = View.VISIBLE
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentChatBinding.inflate(inflater, container, false)
        viewModel = ViewModelProvider(this).get(ChatViewModel::class.java)

        setupRecyclerView()
        setupUI()
        observeViewModel()

        return binding.root
    }

    private fun setupRecyclerView() {
        adapter = ChatAdapter(mutableListOf()) { bitmap ->
            viewModel.analyzeImage(bitmap)
        }
        binding.rvChat.layoutManager = LinearLayoutManager(context)
        binding.rvChat.adapter = adapter
    }

    private fun setupUI() {
        binding.btnCamera.setOnClickListener {
            checkAndRequestCameraPermission()
        }

        binding.btnAttach.setOnClickListener {
            checkAndRequestGalleryPermission()
        }

        binding.btnRemoveImage.setOnClickListener {
            selectedBitmap = null
            binding.cardImagePreview.visibility = View.GONE
        }

        binding.btnAnalyze.setOnClickListener {
            selectedBitmap?.let {
                viewModel.analyzeImage(it)
                selectedBitmap = null
                binding.cardImagePreview.visibility = View.GONE
            } ?: run {
                Toast.makeText(context, "Please capture or select an image first", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnSend.setOnClickListener {
            val text = binding.etMessage.text.toString().trim()
            if (text.isNotEmpty() || selectedBitmap != null) {
                viewModel.sendMessage(text, selectedBitmap)
                binding.etMessage.text.clear()
                selectedBitmap = null
                binding.cardImagePreview.visibility = View.GONE
            }
        }
    }

    private fun checkAndRequestCameraPermission() {
        when {
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                launchCamera()
            }
            else -> {
                showPermissionExplanation(
                    "Camera Access",
                    "Allow camera access to scan your condition instantly using AI.",
                    R.drawable.ic_camera
                ) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                }
            }
        }
    }

    private fun checkAndRequestGalleryPermission() {
        val permission = getGalleryPermission()
        when {
            ContextCompat.checkSelfPermission(
                requireContext(),
                permission
            ) == PackageManager.PERMISSION_GRANTED -> {
                pickImage.launch("image/*")
            }
            else -> {
                showPermissionExplanation(
                    "Gallery Access",
                    "Allow access to your photos to upload images for analysis.",
                    R.drawable.ic_leaf
                ) {
                    galleryPermissionLauncher.launch(permission)
                }
            }
        }
    }

    private fun getGalleryPermission(): String {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Manifest.permission.READ_MEDIA_IMAGES
        } else {
            Manifest.permission.READ_EXTERNAL_STORAGE
        }
    }

    private fun showPermissionExplanation(
        title: String,
        description: String,
        iconRes: Int,
        onAllow: () -> Unit
    ) {
        val bottomSheet = PermissionBottomSheetFragment(
            title, description, iconRes, onAllow
        )
        bottomSheet.show(parentFragmentManager, PermissionBottomSheetFragment.TAG)
    }

    private fun launchCamera() {
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        try {
            takePhotoLauncher.launch(takePictureIntent)
        } catch (e: Exception) {
            Toast.makeText(context, "Camera not available", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handlePermissionDenied(permission: String) {
        if (!shouldShowRequestPermissionRationale(permission)) {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle("Permission Required")
                .setMessage("This feature requires the permission to function. Please enable it in the app settings.")
                .setPositiveButton("Open Settings") { _, _ ->
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    val uri = Uri.fromParts("package", requireContext().packageName, null)
                    intent.data = uri
                    startActivity(intent)
                }
                .setNegativeButton("Cancel", null)
                .show()
        } else {
            Toast.makeText(context, "Permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    private fun observeViewModel() {
        viewModel.messages.observe(viewLifecycleOwner) { messages ->
            adapter = ChatAdapter(messages) { bitmap ->
                viewModel.analyzeImage(bitmap)
            }
            binding.rvChat.adapter = adapter
            binding.rvChat.scrollToPosition(messages.size - 1)
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        viewModel.insufficientBalance.observe(viewLifecycleOwner) { insufficient ->
            if (insufficient) {
                // Navigate to wallet or show recharge dialog
                findNavController().navigate(R.id.navigation_wallet)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
