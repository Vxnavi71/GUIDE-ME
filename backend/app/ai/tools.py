import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.repositories import (
    GoalRepository,
    HabitRepository,
    JournalRepository,
    MoodStressRepository,
    WellnessRepository,
    ConversationRepository,
)
from app.ml.nlp_engine import NLPEmotionJournalEngine

logger = logging.getLogger("guideme.ai.tools")

# Gemini Function Declarations Schema
GEMINI_FUNCTION_DECLARATIONS = [
    {
        "name": "create_goal",
        "description": "Create a new goal for the user in the GuideMe wellness platform.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "The concise, actionable title of the goal (e.g. 'Daily 20-min Mindful Walk').",
                },
                "category": {
                    "type": "STRING",
                    "description": "Category for the goal: 'wellness', 'career', 'mindfulness', 'physical'. Default is 'wellness'.",
                },
                "description": {
                    "type": "STRING",
                    "description": "Optional background or motivating detail for this goal.",
                },
                "target_date": {
                    "type": "STRING",
                    "description": "Optional ISO target date (e.g. '2026-05-01').",
                },
                "milestones": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Optional initial sub-milestones for this goal.",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "update_goal",
        "description": "Update the title, status, or progress of an existing goal.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "goal_id": {
                    "type": "STRING",
                    "description": "The unique ID of the goal to update.",
                },
                "title": {
                    "type": "STRING",
                    "description": "New title for the goal.",
                },
                "status": {
                    "type": "STRING",
                    "description": "New status: 'in_progress', 'completed', 'archived'.",
                },
                "progress_percentage": {
                    "type": "INTEGER",
                    "description": "Progress percentage between 0 and 100.",
                },
            },
            "required": ["goal_id"],
        },
    },
    {
        "name": "delete_goal",
        "description": "Permanently delete a goal. DESTRUCTIVE ACTION: Automatically pauses to request explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "goal_id": {
                    "type": "STRING",
                    "description": "The unique ID of the goal to delete.",
                },
                "goal_title": {
                    "type": "STRING",
                    "description": "The title of the goal to delete (for confirmation display).",
                },
            },
            "required": ["goal_id"],
        },
    },
    {
        "name": "create_habit",
        "description": "Create a new recurring habit for the user to track daily or weekly.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "The habit title (e.g. 'Drink 2L Water', 'Morning Stretch').",
                },
                "category": {
                    "type": "STRING",
                    "description": "Category: 'wellness', 'mindfulness', 'productivity', 'fitness'. Default is 'wellness'.",
                },
                "description": {
                    "type": "STRING",
                    "description": "Optional description or context for the habit.",
                },
                "target_frequency": {
                    "type": "STRING",
                    "description": "Frequency: 'daily', 'weekly'. Default is 'daily'.",
                },
                "target_per_day": {
                    "type": "INTEGER",
                    "description": "Target completions per period (default 1).",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "complete_habit",
        "description": "Log or toggle habit completion for today.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "habit_id": {
                    "type": "STRING",
                    "description": "The unique ID of the habit to complete.",
                },
            },
            "required": ["habit_id"],
        },
    },
    {
        "name": "delete_habit",
        "description": "Permanently delete a habit. DESTRUCTIVE ACTION: Automatically pauses to request explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "habit_id": {
                    "type": "STRING",
                    "description": "The unique ID of the habit to delete.",
                },
                "habit_title": {
                    "type": "STRING",
                    "description": "The title of the habit to delete (for confirmation display).",
                },
            },
            "required": ["habit_id"],
        },
    },
    {
        "name": "create_journal_entry",
        "description": "Save a reflective journal entry for the user with automatic clinical sentiment and cognitive distortion analysis.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "title": {
                    "type": "STRING",
                    "description": "Title or summary topic of the reflection.",
                },
                "content": {
                    "type": "STRING",
                    "description": "The full text of the user's reflection or journal entry.",
                },
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Optional tags (e.g. ['mindfulness', 'gratitude', 'work']).",
                },
                "mood_context": {
                    "type": "STRING",
                    "description": "Optional mood context (e.g. 'peaceful', 'anxious', 'determined').",
                },
            },
            "required": ["title", "content"],
        },
    },
    {
        "name": "get_user_wellbeing_data",
        "description": "Query the user's live GuideMe ecosystem metrics: active goals, habits, sleep, stress observations, mood, or digital wellbeing.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "category": {
                    "type": "STRING",
                    "description": "Category to query: 'all', 'goals', 'habits', 'sleep', 'stress', 'mood', 'digital_wellbeing'. Default is 'all'.",
                },
            },
        },
    },
    {
        "name": "log_quick_mood",
        "description": "Log the user's self-reported mood on a scale of 1.0 to 10.0.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "score": {
                    "type": "NUMBER",
                    "description": "Mood score between 1.0 (lowest) and 10.0 (highest).",
                },
                "primary_emotion": {
                    "type": "STRING",
                    "description": "Optional primary emotion (e.g. 'calm', 'hopeful', 'exhausted', 'overwhelmed').",
                },
                "note": {
                    "type": "STRING",
                    "description": "Optional brief note describing why the user feels this way.",
                },
            },
            "required": ["score"],
        },
    },
]

import json
import os

PENDING_ACTIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "pending_actions.json")

def _load_pending() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(PENDING_ACTIONS_FILE):
        return {}
    try:
        with open(PENDING_ACTIONS_FILE, "r") as f:
            data = json.load(f)
            for k, v in data.items():
                if isinstance(v.get("created_at"), str):
                    v["created_at"] = datetime.fromisoformat(v["created_at"])
                if isinstance(v.get("expires_at"), str):
                    v["expires_at"] = datetime.fromisoformat(v["expires_at"])
            return data
    except Exception as e:
        logger.error(f"Failed to load pending actions: {e}")
        return {}

def _save_pending(data: Dict[str, Dict[str, Any]]):
    try:
        serializable_data = {}
        for k, v in data.items():
            item_copy = dict(v)
            if isinstance(item_copy.get("created_at"), datetime):
                item_copy["created_at"] = item_copy["created_at"].isoformat()
            if isinstance(item_copy.get("expires_at"), datetime):
                item_copy["expires_at"] = item_copy["expires_at"].isoformat()
            serializable_data[k] = item_copy
        
        with open(PENDING_ACTIONS_FILE, "w") as f:
            json.dump(serializable_data, f)
    except Exception as e:
        logger.error(f"Failed to save pending actions: {e}")


class ToolDispatcher:
    """
    Executes native tool calls for the AI Companion against the GuideMe database.
    Enforces safety boundaries: destructive operations require explicit user approval.
    """

    DESTRUCTIVE_TOOLS = {"delete_goal", "delete_habit"}

    @classmethod
    def get_gemini_tools_spec(cls) -> List[Dict[str, Any]]:
        return [{"function_declarations": GEMINI_FUNCTION_DECLARATIONS}]

    @classmethod
    async def execute(
        cls,
        tool_name: str,
        args: Dict[str, Any],
        user_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Executes a tool call. If the tool is destructive, halts and creates a pending confirmation.
        """
        logger.info(f"Tool invocation requested: {tool_name} with args: {args} for user {user_id}")

        # Check if destructive
        if tool_name in cls.DESTRUCTIVE_TOOLS:
            action_id = str(uuid.uuid4())
            description = ""
            if tool_name == "delete_goal":
                title = args.get("goal_title") or args.get("goal_id")
                description = f"Delete goal '{title}' permanently"
            elif tool_name == "delete_habit":
                title = args.get("habit_title") or args.get("habit_id")
                description = f"Delete habit '{title}' permanently"

            pending = {
                "action_id": action_id,
                "user_id": user_id,
                "tool_name": tool_name,
                "parameters": args,
                "description": description,
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
            }
            pending_actions = _load_pending()
            pending_actions[action_id] = pending
            _save_pending(pending_actions)

            return {
                "confirmation_required": True,
                "action_id": action_id,
                "tool": tool_name,
                "description": description,
                "parameters": args,
                "message": f"Confirmation required before executing: {description}",
            }

        # Non-destructive tool execution
        try:
            if tool_name == "create_goal":
                goal_repo = GoalRepository(db)
                target_dt = None
                if args.get("target_date"):
                    try:
                        target_dt = datetime.fromisoformat(args["target_date"].replace("Z", "+00:00"))
                    except Exception:
                        pass

                created = await goal_repo.create(
                    user_id=user_id,
                    title=args["title"],
                    description=args.get("description"),
                    category=args.get("category", "wellness"),
                    target_date=target_dt,
                    milestones=args.get("milestones", []),
                )
                return {
                    "status": "success",
                    "action": "goal_created",
                    "goal_id": created.id,
                    "title": created.title,
                    "category": created.category,
                    "message": f"Goal '{created.title}' has been successfully added to your dashboard.",
                }

            elif tool_name == "update_goal":
                goal_repo = GoalRepository(db)
                goal_id = args["goal_id"]
                update_data = {}
                if "title" in args:
                    update_data["title"] = args["title"]
                if "status" in args:
                    update_data["status"] = args["status"]
                if "progress_percentage" in args:
                    update_data["progress_percentage"] = args["progress_percentage"]

                updated = await goal_repo.update(goal_id, user_id, update_data)
                if not updated:
                    return {"status": "error", "message": f"Goal with ID {goal_id} not found."}
                return {
                    "status": "success",
                    "action": "goal_updated",
                    "goal_id": updated.id,
                    "title": updated.title,
                    "status_val": updated.status,
                    "progress": updated.progress_percentage,
                    "message": f"Goal '{updated.title}' updated successfully.",
                }

            elif tool_name == "create_habit":
                habit_repo = HabitRepository(db)
                habit = await habit_repo.create(
                    user_id=user_id,
                    title=args["title"],
                    description=args.get("description"),
                    category=args.get("category", "wellness"),
                    target_frequency=args.get("target_frequency", "daily"),
                    target_per_day=args.get("target_per_day", 1),
                )
                return {
                    "status": "success",
                    "action": "habit_created",
                    "habit_id": habit.id,
                    "title": habit.title,
                    "frequency": habit.target_frequency,
                    "message": f"Habit '{habit.title}' added. You can now build your streak.",
                }

            elif tool_name == "complete_habit":
                habit_repo = HabitRepository(db)
                res = await habit_repo.toggle_completion(args["habit_id"], user_id)
                if not res:
                    return {"status": "error", "message": "Habit not found."}
                status_text = "completed for today" if res["completed_today"] else "unmarked"
                return {
                    "status": "success",
                    "action": "habit_completed",
                    "habit_id": res["id"],
                    "title": res["title"],
                    "streak_count": res["streak_count"],
                    "completed_today": res["completed_today"],
                    "message": f"Habit '{res['title']}' is now {status_text}. Current streak: {res['streak_count']} days.",
                }

            elif tool_name == "create_journal_entry":
                journal_repo = JournalRepository(db)
                journal = await journal_repo.create(
                    user_id=user_id,
                    title=args["title"],
                    content=args["content"],
                    tags=args.get("tags", []),
                    mood_context=args.get("mood_context"),
                )
                # Run NLP Engine analysis on content
                analysis_res = NLPEmotionJournalEngine.analyze_text(journal.content)
                await journal_repo.attach_analysis(
                    journal_id=journal.id,
                    user_id=user_id,
                    sentiment_score=analysis_res.get("sentiment_score"),
                    dominant_emotion=analysis_res.get("dominant_emotion", "Reflective"),
                    cognitive_distortions=analysis_res.get("cognitive_distortions", []),
                    topics=analysis_res.get("topics", []),
                    reflection_prompt=analysis_res.get("reflection_prompt"),
                    recommended_action=analysis_res.get("recommended_action"),
                )
                return {
                    "status": "success",
                    "action": "journal_saved",
                    "journal_id": journal.id,
                    "title": journal.title,
                    "dominant_emotion": analysis_res.get("dominant_emotion"),
                    "message": f"Journal reflection '{journal.title}' recorded safely.",
                }

            elif tool_name == "log_quick_mood":
                mood_repo = MoodStressRepository(db)
                score = float(args["score"])
                emotion = args.get("primary_emotion", "Neutral")
                valence = round((score - 5.5) / 4.5, 2)
                arousal = 0.5
                entry = await mood_repo.log_mood(
                    user_id=user_id,
                    score=score,
                    valence=valence,
                    arousal=arousal,
                    energy_level="medium",
                    tags=[emotion] if emotion else [],
                    note=args.get("note"),
                )
                return {
                    "status": "success",
                    "action": "mood_logged",
                    "score": entry.score,
                    "primary_emotion": emotion,
                    "message": f"Mood logged as {entry.score}/10 ({emotion}).",
                }

            elif tool_name == "get_user_wellbeing_data":
                category = args.get("category", "all")
                data: Dict[str, Any] = {}

                if category in ("all", "goals"):
                    goal_repo = GoalRepository(db)
                    goals = await goal_repo.list_by_user(user_id)
                    data["goals"] = [
                        {
                            "id": g.id,
                            "title": g.title,
                            "category": g.category,
                            "progress": g.progress_percentage,
                            "status": g.status,
                        }
                        for g in goals[:5]
                    ]

                if category in ("all", "habits"):
                    habit_repo = HabitRepository(db)
                    habits = await habit_repo.list_by_user(user_id)
                    data["habits"] = [
                        {
                            "id": h["id"],
                            "title": h["title"],
                            "streak": h["streak_count"],
                            "completed_today": h["completed_today"],
                        }
                        for h in habits[:5]
                    ]

                if category in ("all", "mood"):
                    mood_repo = MoodStressRepository(db)
                    moods = await mood_repo.list_moods(user_id, limit=3)
                    data["recent_moods"] = [
                        {"score": m.score, "date": m.recorded_at.strftime("%Y-%m-%d %H:%M")}
                        for m in moods
                    ]

                if category in ("all", "stress"):
                    mood_repo = MoodStressRepository(db)
                    stress = await mood_repo.get_latest_stress(user_id)
                    if stress:
                        data["latest_stress"] = {
                            "score": stress.score,
                            "risk_band": stress.risk_band,
                            "confidence": stress.confidence,
                        }
                    else:
                        data["latest_stress"] = None

                if category in ("all", "sleep"):
                    wellness_repo = WellnessRepository(db)
                    metrics = await wellness_repo.list_recent_metrics(user_id, limit=2)
                    if metrics and metrics[0].sleep_hours is not None:
                        data["latest_sleep"] = {
                            "sleep_hours": metrics[0].sleep_hours,
                            "deep_sleep_hours": metrics[0].deep_sleep_hours,
                            "date": metrics[0].metric_date,
                        }
                    else:
                        data["latest_sleep"] = None

                return {
                    "status": "success",
                    "action": "wellbeing_queried",
                    "category": category,
                    "data": data,
                }

            else:
                return {"status": "error", "message": f"Unknown tool: {tool_name}"}

        except Exception as exc:
            logger.error(f"Error executing tool {tool_name}: {exc}", exc_info=True)
            return {"status": "error", "message": f"Failed to execute tool {tool_name}: {str(exc)}"}

    @classmethod
    async def confirm_action(
        cls,
        action_id: str,
        user_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Executes a previously held destructive tool action after explicit user confirmation.
        """
        pending_actions = _load_pending()
        pending = pending_actions.get(action_id)
        if not pending:
            return {"status": "error", "message": "Pending action expired or not found."}

        if pending["user_id"] != user_id:
            return {"status": "error", "message": "Unauthorized for this action."}

        # Check expiration (15 minutes)
        if datetime.now(timezone.utc) > pending["expires_at"]:
            pending_actions.pop(action_id, None)
            _save_pending(pending_actions)
            return {"status": "error", "message": "Action has expired. Please ask the companion again."}

        tool_name = pending["tool_name"]
        args = pending["parameters"]

        try:
            if tool_name == "delete_goal":
                goal_repo = GoalRepository(db)
                deleted = await goal_repo.delete(args["goal_id"], user_id)
                pending_actions.pop(action_id, None)
                _save_pending(pending_actions)
                if deleted:
                    return {
                        "status": "success",
                        "tool": tool_name,
                        "action_id": action_id,
                        "message": f"Goal '{args.get('goal_title') or args['goal_id']}' has been deleted.",
                    }
                return {"status": "error", "message": "Goal was not found or already deleted."}

            elif tool_name == "delete_habit":
                habit_repo = HabitRepository(db)
                deleted = await habit_repo.delete(args["habit_id"], user_id)
                pending_actions.pop(action_id, None)
                _save_pending(pending_actions)
                if deleted:
                    return {
                        "status": "success",
                        "tool": tool_name,
                        "action_id": action_id,
                        "message": f"Habit '{args.get('habit_title') or args['habit_id']}' has been deleted.",
                    }
                return {"status": "error", "message": "Habit was not found or already deleted."}

            else:
                pending_actions.pop(action_id, None)
                _save_pending(pending_actions)
                return {"status": "error", "message": f"Unrecognized destructive tool: {tool_name}"}

        except Exception as exc:
            logger.error(f"Error executing confirmed action {action_id}: {exc}", exc_info=True)
            return {"status": "error", "message": f"Error executing action: {str(exc)}"}

    @classmethod
    def cancel_action(cls, action_id: str, user_id: str) -> Dict[str, Any]:
        """
        Cancels a pending destructive action.
        """
        pending_actions = _load_pending()
        pending = pending_actions.get(action_id)
        if not pending or pending["user_id"] != user_id:
            return {"status": "error", "message": "Pending action not found."}

        pending_actions.pop(action_id, None)
        _save_pending(pending_actions)
        return {
            "status": "cancelled",
            "action_id": action_id,
            "message": "Action safely cancelled.",
        }
