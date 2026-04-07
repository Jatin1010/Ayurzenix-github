package in.ayurzenix.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
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
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import in.ayurzenix.app.R
import in.ayurzenix.app.databinding.FragmentBodyScanBinding

class BodyScanFragment : Fragment() {

    private var _binding: FragmentBodyScanBinding? = null
    private val binding get() = _binding!!

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
            launchGallery()
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
                // Navigate to Chat or Analysis Result with this bitmap
                // For now, let's just show a toast
                Toast.makeText(context, "Photo captured successfully!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            Toast.makeText(context, "Image selected from gallery!", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentBodyScanBinding.inflate(inflater, container, false)
        setupUI()
        return binding.root
    }

    private fun setupUI() {
        binding.btnBack.setOnClickListener {
            findNavController().navigateUp()
        }

        binding.cardTakePhoto.setOnClickListener {
            checkAndRequestCameraPermission()
        }

        binding.cardUploadGallery.setOnClickListener {
            checkAndRequestGalleryPermission()
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
            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                showPermissionExplanation(
                    "Camera Access",
                    "Allow camera access to scan your condition instantly using AI.",
                    R.drawable.ic_camera
                ) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                }
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
                launchGallery()
            }
            shouldShowRequestPermissionRationale(permission) -> {
                showPermissionExplanation(
                    "Gallery Access",
                    "Allow access to your photos to upload images for analysis.",
                    R.drawable.ic_leaf
                ) {
                    galleryPermissionLauncher.launch(permission)
                }
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

    private fun launchGallery() {
        pickImageLauncher.launch("image/*")
    }

    private fun handlePermissionDenied(permission: String) {
        if (!shouldShowRequestPermissionRationale(permission)) {
            // User selected "Don't ask again"
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
