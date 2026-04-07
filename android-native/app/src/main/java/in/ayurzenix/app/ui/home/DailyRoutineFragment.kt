package in.ayurzenix.app.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import in.ayurzenix.app.R
import in.ayurzenix.app.model.DailyRoutine
import in.ayurzenix.app.viewmodel.DailyRoutineViewModel

class DailyRoutineFragment : Fragment() {

    private val viewModel: DailyRoutineViewModel by viewModels()

    private lateinit var progressBar: ProgressBar
    private lateinit var tvProgressLabel: TextView
    private lateinit var layoutQuiz: LinearLayout
    private lateinit var layoutTargets: LinearLayout
    private lateinit var layoutTasks: LinearLayout
    private lateinit var cardMonetizationCTA: CardView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_daily_routine, container, false)

        progressBar = view.findViewById(R.id.progressBar)
        tvProgressLabel = view.findViewById(R.id.tvProgressLabel)
        layoutQuiz = view.findViewById(R.id.layoutQuiz)
        layoutTargets = view.findViewById(R.id.layoutTargets)
        layoutTasks = view.findViewById(R.id.layoutTasks)
        cardMonetizationCTA = view.findViewById(R.id.cardMonetizationCTA)

        view.findViewById<Button>(R.id.btnTryBodyScan).setOnClickListener {
            // Navigate to Body Scan or Wallet
        }

        viewModel.routine.observe(viewLifecycleOwner) { routine ->
            if (routine != null) {
                renderRoutine(routine)
            }
        }

        viewModel.progress.observe(viewLifecycleOwner) { progress ->
            progressBar.progress = progress
            tvProgressLabel.text = "Today's Progress: $progress%"
            if (progress >= 60) {
                cardMonetizationCTA.visibility = View.VISIBLE
            }
        }

        if (viewModel.routine.value == null) {
            viewModel.generateDailyRoutine()
        }

        return view
    }

    private fun renderRoutine(routine: DailyRoutine) {
        layoutQuiz.removeAllViews()
        routine.quiz.forEachIndexed { index, quizQuestion ->
            val quizView = LayoutInflater.from(context).inflate(R.layout.item_routine_quiz, layoutQuiz, false)
            quizView.findViewById<TextView>(R.id.tvQuestion).text = quizQuestion.question
            
            val btnYes = quizView.findViewById<Button>(R.id.btnYes)
            val btnNo = quizView.findViewById<Button>(R.id.btnNo)

            if (quizQuestion.isAnswered) {
                btnYes.isEnabled = false
                btnNo.isEnabled = false
                if (quizQuestion.answer == true) {
                    btnYes.setBackgroundColor(ContextCompat.getColor(requireContext(), R.color.green_500))
                    btnYes.setTextColor(ContextCompat.getColor(requireContext(), R.color.white))
                } else {
                    btnNo.setBackgroundColor(ContextCompat.getColor(requireContext(), R.color.red_500))
                    btnNo.setTextColor(ContextCompat.getColor(requireContext(), R.color.white))
                }
            }

            btnYes.setOnClickListener { viewModel.updateQuizAnswer(index, true) }
            btnNo.setOnClickListener { viewModel.updateQuizAnswer(index, false) }
            
            layoutQuiz.addView(quizView)
        }

        layoutTargets.removeAllViews()
        routine.targets.forEachIndexed { index, target ->
            val targetView = LayoutInflater.from(context).inflate(R.layout.item_routine_checkbox, layoutTargets, false)
            val checkBox = targetView.findViewById<CheckBox>(R.id.checkBox)
            checkBox.text = target.target
            checkBox.isChecked = target.isCompleted
            checkBox.setOnCheckedChangeListener { _, _ -> viewModel.toggleTarget(index) }
            layoutTargets.addView(targetView)
        }

        layoutTasks.removeAllViews()
        routine.tasks.forEachIndexed { index, task ->
            val taskView = LayoutInflater.from(context).inflate(R.layout.item_routine_checkbox, layoutTasks, false)
            val checkBox = taskView.findViewById<CheckBox>(R.id.checkBox)
            checkBox.text = task.habit
            checkBox.isChecked = task.isCompleted
            checkBox.setOnCheckedChangeListener { _, _ -> viewModel.toggleTask(index) }
            layoutTasks.addView(taskView)
        }
    }
}
