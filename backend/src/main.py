"""
Main entry point for the diving conditions checker.
"""
from services.diving_conditions_service import DivingConditionsService

def main():
    """Main function to run the diving conditions analysis."""
    service = DivingConditionsService()
    service.analyze_conditions()

if __name__ == "__main__":
    main() 