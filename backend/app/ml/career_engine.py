from typing import List, Dict, Optional

class CareerPathwayEngine:
    # A mapping of 20+ career domains to their specific characteristics
    CAREER_DOMAINS = {
        "Software Engineering": {
            "ocean_weights": {"openness": 0.5, "conscientiousness": 0.8, "extraversion": -0.2, "agreeableness": 0.1, "neuroticism_inverse": 0.6},
            "required_skills": ["Programming", "System Design", "Problem Solving", "Algorithms", "Debugging"],
            "sample_roles": {"entry": "Junior Developer", "mid": "Senior Software Engineer", "senior": "Principal Engineer / Architect"},
            "learning_roadmap": ["Learn foundational programming", "Data structures and algorithms", "System architecture", "Advanced problem-solving"],
        },
        "UX/Product Design": {
            "ocean_weights": {"openness": 0.9, "conscientiousness": 0.5, "extraversion": 0.4, "agreeableness": 0.7, "neuroticism_inverse": 0.4},
            "required_skills": ["User Empathy", "Wireframing", "Prototyping", "Visual Design", "User Testing"],
            "sample_roles": {"entry": "Junior UX Designer", "mid": "Product Designer", "senior": "VP of Design"},
            "learning_roadmap": ["Learn design principles", "Master design tools like Figma", "Study human-computer interaction", "Build a portfolio"],
        },
        "Data Science": {
            "ocean_weights": {"openness": 0.7, "conscientiousness": 0.8, "extraversion": -0.3, "agreeableness": 0.2, "neuroticism_inverse": 0.5},
            "required_skills": ["Statistics", "Python/R", "Machine Learning", "Data Visualization", "SQL"],
            "sample_roles": {"entry": "Data Analyst", "mid": "Data Scientist", "senior": "Head of Data"},
            "learning_roadmap": ["Learn statistics and probability", "Master Python and SQL", "Study machine learning algorithms", "Work on real-world datasets"],
        },
        "Clinical Psychology": {
            "ocean_weights": {"openness": 0.8, "conscientiousness": 0.7, "extraversion": 0.6, "agreeableness": 0.9, "neuroticism_inverse": 0.7},
            "required_skills": ["Active Listening", "Empathy", "Clinical Assessment", "Therapeutic Techniques", "Ethics"],
            "sample_roles": {"entry": "Counselor", "mid": "Clinical Psychologist", "senior": "Clinical Director"},
            "learning_roadmap": ["Earn a psychology degree", "Complete supervised clinical hours", "Obtain licensure", "Specialize in a therapeutic approach"],
        },
        "Entrepreneurship": {
            "ocean_weights": {"openness": 0.9, "conscientiousness": 0.8, "extraversion": 0.8, "agreeableness": 0.4, "neuroticism_inverse": 0.8},
            "required_skills": ["Leadership", "Risk Management", "Sales", "Strategic Planning", "Networking"],
            "sample_roles": {"entry": "Founder", "mid": "CEO (Growth Stage)", "senior": "Serial Entrepreneur / Investor"},
            "learning_roadmap": ["Identify market gaps", "Build an MVP", "Learn basic finance and sales", "Scale operations"],
        },
        "Content Creation": {
            "ocean_weights": {"openness": 0.9, "conscientiousness": 0.5, "extraversion": 0.7, "agreeableness": 0.6, "neuroticism_inverse": 0.3},
            "required_skills": ["Writing/Video Editing", "Creativity", "SEO", "Audience Engagement", "Marketing"],
            "sample_roles": {"entry": "Content Writer/Creator", "mid": "Content Strategist", "senior": "Creative Director"},
            "learning_roadmap": ["Develop a content niche", "Master content creation tools", "Understand platform algorithms", "Monetize content"],
        },
        "Teaching/Education": {
            "ocean_weights": {"openness": 0.6, "conscientiousness": 0.8, "extraversion": 0.7, "agreeableness": 0.9, "neuroticism_inverse": 0.5},
            "required_skills": ["Communication", "Patience", "Curriculum Design", "Mentorship", "Public Speaking"],
            "sample_roles": {"entry": "Teacher", "mid": "Curriculum Developer", "senior": "Principal/Educational Director"},
            "learning_roadmap": ["Earn teaching credentials", "Develop classroom management skills", "Learn instructional design", "Pursue educational leadership"],
        },
        "Healthcare": {
            "ocean_weights": {"openness": 0.5, "conscientiousness": 0.9, "extraversion": 0.6, "agreeableness": 0.8, "neuroticism_inverse": 0.7},
            "required_skills": ["Patient Care", "Medical Knowledge", "Working Under Pressure", "Attention to Detail", "Teamwork"],
            "sample_roles": {"entry": "Registered Nurse", "mid": "Nurse Practitioner / Specialist", "senior": "Chief Medical Officer"},
            "learning_roadmap": ["Complete medical or nursing school", "Pass licensing exams", "Complete residency/clinical practice", "Pursue advanced specializations"],
        },
        "Research/Academia": {
            "ocean_weights": {"openness": 0.9, "conscientiousness": 0.9, "extraversion": -0.2, "agreeableness": 0.3, "neuroticism_inverse": 0.5},
            "required_skills": ["Critical Thinking", "Research Methodology", "Academic Writing", "Data Analysis", "Grant Writing"],
            "sample_roles": {"entry": "Research Assistant", "mid": "Postdoctoral Researcher", "senior": "Tenured Professor / Principal Investigator"},
            "learning_roadmap": ["Obtain a Ph.D.", "Publish research papers", "Secure research funding", "Lead a research lab"],
        },
        "Marketing": {
            "ocean_weights": {"openness": 0.7, "conscientiousness": 0.6, "extraversion": 0.8, "agreeableness": 0.6, "neuroticism_inverse": 0.4},
            "required_skills": ["Market Research", "Copywriting", "Campaign Management", "Data Analytics", "Communication"],
            "sample_roles": {"entry": "Marketing Coordinator", "mid": "Marketing Manager", "senior": "Chief Marketing Officer"},
            "learning_roadmap": ["Learn digital marketing fundamentals", "Understand consumer psychology", "Master analytics tools", "Develop brand strategies"],
        },
        "Finance/Consulting": {
            "ocean_weights": {"openness": 0.4, "conscientiousness": 0.9, "extraversion": 0.6, "agreeableness": 0.3, "neuroticism_inverse": 0.8},
            "required_skills": ["Financial Modeling", "Analytical Thinking", "Client Management", "Presentation", "Strategic Advising"],
            "sample_roles": {"entry": "Financial Analyst", "mid": "Management Consultant", "senior": "Partner / CFO"},
            "learning_roadmap": ["Learn financial accounting", "Master Excel and financial modeling", "Develop case study skills", "Build client relationships"],
        },
        "Social Work": {
            "ocean_weights": {"openness": 0.6, "conscientiousness": 0.7, "extraversion": 0.7, "agreeableness": 0.9, "neuroticism_inverse": 0.3},
            "required_skills": ["Crisis Intervention", "Empathy", "Advocacy", "Case Management", "Active Listening"],
            "sample_roles": {"entry": "Social Worker", "mid": "Clinical Social Worker", "senior": "Director of Social Services"},
            "learning_roadmap": ["Obtain a degree in social work", "Complete field practicums", "Get licensed", "Specialize in a demographic or issue"],
        },
        "Creative Arts": {
            "ocean_weights": {"openness": 1.0, "conscientiousness": 0.4, "extraversion": 0.5, "agreeableness": 0.6, "neuroticism_inverse": 0.2},
            "required_skills": ["Artistic Expression", "Originality", "Technical Art Skills", "Storytelling", "Adaptability"],
            "sample_roles": {"entry": "Freelance Artist", "mid": "Art Director", "senior": "Creative Director"},
            "learning_roadmap": ["Develop foundational techniques", "Build a diverse portfolio", "Network in the arts community", "Exhibit or publish work"],
        },
        "Law/Policy": {
            "ocean_weights": {"openness": 0.6, "conscientiousness": 0.9, "extraversion": 0.7, "agreeableness": 0.4, "neuroticism_inverse": 0.7},
            "required_skills": ["Legal Research", "Argumentation", "Writing", "Negotiation", "Public Speaking"],
            "sample_roles": {"entry": "Junior Associate", "mid": "Senior Counsel", "senior": "Partner / Judge / Policy Director"},
            "learning_roadmap": ["Attend law school", "Pass the bar exam", "Gain litigation or corporate experience", "Develop a practice area"],
        },
        "Environmental Science": {
            "ocean_weights": {"openness": 0.7, "conscientiousness": 0.8, "extraversion": 0.3, "agreeableness": 0.7, "neuroticism_inverse": 0.6},
            "required_skills": ["Field Research", "Data Analysis", "Ecology", "Policy Knowledge", "Sustainability Planning"],
            "sample_roles": {"entry": "Environmental Technician", "mid": "Environmental Scientist", "senior": "Chief Sustainability Officer"},
            "learning_roadmap": ["Study environmental systems", "Learn GIS and data analysis", "Conduct field research", "Influence environmental policy"],
        },
        "Human Resources": {
            "ocean_weights": {"openness": 0.5, "conscientiousness": 0.8, "extraversion": 0.8, "agreeableness": 0.8, "neuroticism_inverse": 0.6},
            "required_skills": ["Conflict Resolution", "Recruitment", "Employee Relations", "Communication", "Organizational Psychology"],
            "sample_roles": {"entry": "HR Coordinator", "mid": "HR Business Partner", "senior": "Chief People Officer"},
            "learning_roadmap": ["Understand employment law", "Develop recruitment strategies", "Master employee relations", "Drive organizational culture"],
        },
        "Project Management": {
            "ocean_weights": {"openness": 0.5, "conscientiousness": 1.0, "extraversion": 0.7, "agreeableness": 0.6, "neuroticism_inverse": 0.8},
            "required_skills": ["Organization", "Leadership", "Risk Management", "Agile/Scrum", "Communication"],
            "sample_roles": {"entry": "Project Coordinator", "mid": "Project Manager", "senior": "Director of PMO"},
            "learning_roadmap": ["Learn project management methodologies", "Obtain PMP or Scrum certification", "Lead small teams", "Manage enterprise projects"],
        },
        "Journalism": {
            "ocean_weights": {"openness": 0.8, "conscientiousness": 0.7, "extraversion": 0.7, "agreeableness": 0.5, "neuroticism_inverse": 0.4},
            "required_skills": ["Investigative Research", "Writing", "Interviewing", "Media Ethics", "Storytelling"],
            "sample_roles": {"entry": "Reporter", "mid": "Investigative Journalist", "senior": "Editor-in-Chief"},
            "learning_roadmap": ["Develop writing skills", "Learn investigative techniques", "Build a network of sources", "Master digital journalism"],
        },
        "Architecture/Design": {
            "ocean_weights": {"openness": 0.9, "conscientiousness": 0.9, "extraversion": 0.4, "agreeableness": 0.5, "neuroticism_inverse": 0.6},
            "required_skills": ["Spatial Design", "CAD Software", "Structural Knowledge", "Project Management", "Creativity"],
            "sample_roles": {"entry": "Junior Architect", "mid": "Licensed Architect", "senior": "Principal Architect"},
            "learning_roadmap": ["Complete architecture degree", "Master drafting software", "Complete apprenticeship hours", "Obtain licensure"],
        },
        "Public Speaking/Leadership": {
            "ocean_weights": {"openness": 0.7, "conscientiousness": 0.8, "extraversion": 1.0, "agreeableness": 0.6, "neuroticism_inverse": 0.8},
            "required_skills": ["Communication", "Persuasion", "Charisma", "Emotional Intelligence", "Storytelling"],
            "sample_roles": {"entry": "Spokesperson", "mid": "Professional Speaker", "senior": "Thought Leader / Executive"},
            "learning_roadmap": ["Join public speaking groups", "Develop core messaging", "Master stage presence", "Build a personal brand"],
        }
    }

    @classmethod
    def generate_recommendations(
        cls,
        ocean_scores: Dict[str, float],
        user_interests: Optional[List[str]] = None,
        user_skills: Optional[List[str]] = None,
        user_education: Optional[str] = None,
        user_goals: Optional[List[str]] = None
    ) -> List[Dict]:
        user_interests = user_interests or []
        user_skills = user_skills or []
        user_goals = user_goals or []
        user_interests_lower = [i.lower() for i in user_interests]
        user_skills_lower = [s.lower() for s in user_skills]

        # Normalize ocean scores to 0-1 range
        normalized_ocean = {
            "openness": ocean_scores.get("openness", 50) / 100.0,
            "conscientiousness": ocean_scores.get("conscientiousness", 50) / 100.0,
            "extraversion": ocean_scores.get("extraversion", 50) / 100.0,
            "agreeableness": ocean_scores.get("agreeableness", 50) / 100.0,
            "neuroticism_inverse": 1.0 - (ocean_scores.get("neuroticism", 50) / 100.0)
        }

        results = []
        for domain, data in cls.CAREER_DOMAINS.items():
            weights = data["ocean_weights"]
            
            # Weighted dot product
            base_score = 0.0
            max_possible_base = 0.0
            
            # Map traits for alignment reasoning
            high_traits = []
            low_traits = []
            
            for trait, user_val in normalized_ocean.items():
                weight = weights.get(trait, 0)
                if weight > 0:
                    base_score += user_val * weight
                    max_possible_base += weight
                elif weight < 0:
                    base_score += (1.0 - user_val) * abs(weight)
                    max_possible_base += abs(weight)
                    
                display_name = trait.replace('_inverse', ' (Emotional Stability)').title()
                original_trait = trait.replace('_inverse', 'neuroticism')
                score_pct = int(ocean_scores.get(original_trait, 50))
                
                # Check alignments for reasoning
                if weight > 0.5 and user_val > 0.6:
                    high_traits.append(f"high {display_name} ({score_pct}%)")
                elif weight > 0.5 and user_val < 0.4:
                    low_traits.append(display_name)
                elif weight < -0.5 and user_val < 0.4:
                    high_traits.append(f"low {display_name} ({score_pct}%)")

            if max_possible_base > 0:
                base_score_normalized = (base_score / max_possible_base) * 100
            else:
                base_score_normalized = 50.0
                
            # Interest bonus (+5 per match)
            interest_bonus = 0
            for skill in data["required_skills"]:
                if any(skill.lower() in i or i in skill.lower() for i in user_interests_lower):
                    interest_bonus += 5
            if any(domain.lower() in i for i in user_interests_lower):
                interest_bonus += 10
                
            # Skill bonus (+3 per match)
            skill_bonus = 0
            skill_gaps = []
            for req_skill in data["required_skills"]:
                if any(req_skill.lower() in s or s in req_skill.lower() for s in user_skills_lower):
                    skill_bonus += 3
                else:
                    skill_gaps.append(req_skill)

            final_score = min(100, max(0, base_score_normalized + interest_bonus + skill_bonus))
            
            alignment_reason = f"Your profile strongly aligns with {domain}."
            if high_traits:
                alignment_reason = f"Your {', '.join(high_traits[:2])} suggest strong natural alignment with the demands of {domain}."

            key_strengths = []
            if normalized_ocean["conscientiousness"] > 0.6: key_strengths.append("Structured Execution")
            if normalized_ocean["openness"] > 0.6: key_strengths.append("Creative Problem Solving")
            if normalized_ocean["extraversion"] > 0.6: key_strengths.append("Team Collaboration")
            if normalized_ocean["agreeableness"] > 0.6: key_strengths.append("Empathetic Communication")
            if normalized_ocean["neuroticism_inverse"] > 0.6: key_strengths.append("Resilience Under Pressure")
            if not key_strengths: key_strengths.append("Adaptability")

            progression = f"Entry: {data['sample_roles']['entry']} -> Mid: {data['sample_roles']['mid']} -> Senior: {data['sample_roles']['senior']}"

            results.append({
                "path_title": domain,
                "match_score": int(final_score),
                "alignment_reason": alignment_reason,
                "why_recommended": alignment_reason,
                "key_strengths": key_strengths,
                "growth_areas": low_traits if low_traits else ["Building domain expertise"],
                "skill_gaps": skill_gaps,
                "learning_roadmap": data["learning_roadmap"],
                "possible_roles": list(data["sample_roles"].values()),
                "progression_path": progression,
                "required_skills": data["required_skills"]
            })

        # Sort by match score and return top 5
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results[:5]
