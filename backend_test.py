import requests
import sys
import json
from datetime import datetime, timedelta

class AttendanceAPITester:
    def __init__(self, base_url="https://academic-checkin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.admin_user = None
        self.teacher_user = None
        self.student_user = None
        self.parent_user = None
        self.test_class = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_health_check(self):
        """Test basic API health"""
        print("\n🔍 Testing API Health...")
        try:
            response = requests.get(f"{self.base_url}/docs")
            success = response.status_code == 200
            self.log_test("API Documentation Access", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Documentation Access", False, f"Error: {str(e)}")

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication Endpoints...")
        
        # Test /auth/me without session (should fail)
        self.run_test(
            "Get Current User (No Auth)",
            "GET",
            "auth/me",
            401
        )
        
        # Test logout without session
        self.run_test(
            "Logout (No Session)",
            "POST", 
            "auth/logout",
            200
        )

    def test_user_management_endpoints(self):
        """Test user management endpoints (requires admin auth)"""
        print("\n🔍 Testing User Management Endpoints...")
        
        # Test get users without auth (should fail)
        self.run_test(
            "Get Users (No Auth)",
            "GET",
            "users",
            401
        )
        
        # Test create user without auth (should fail)
        test_user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "role": "student"
        }
        
        self.run_test(
            "Create User (No Auth)",
            "POST",
            "users",
            401,
            data=test_user_data
        )

    def test_class_management_endpoints(self):
        """Test class management endpoints"""
        print("\n🔍 Testing Class Management Endpoints...")
        
        # Test get classes without auth (should fail)
        self.run_test(
            "Get Classes (No Auth)",
            "GET",
            "classes",
            401
        )
        
        # Test create class without auth (should fail)
        test_class_data = {
            "name": "12-A Commerce",
            "division": "A",
            "stream": "Commerce",
            "grade": "12"
        }
        
        self.run_test(
            "Create Class (No Auth)",
            "POST",
            "classes",
            401,
            data=test_class_data
        )

    def test_attendance_endpoints(self):
        """Test attendance endpoints"""
        print("\n🔍 Testing Attendance Endpoints...")
        
        # Test get attendance without auth (should fail)
        self.run_test(
            "Get Class Attendance (No Auth)",
            "GET",
            "attendance/test-class-id",
            401
        )
        
        # Test mark attendance without auth (should fail)
        test_attendance_data = {
            "class_id": "test-class-id",
            "date": "2024-01-15",
            "attendance_records": [
                {
                    "student_id": "test-student-id",
                    "status": "present"
                }
            ]
        }
        
        self.run_test(
            "Mark Attendance (No Auth)",
            "POST",
            "attendance/test-class-id",
            401,
            data=test_attendance_data
        )

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        print("\n🔍 Testing Dashboard Endpoints...")
        
        # Test dashboard stats without auth (should fail)
        self.run_test(
            "Get Dashboard Stats (No Auth)",
            "GET",
            "dashboard/stats",
            401
        )

    def test_cors_headers(self):
        """Test CORS configuration"""
        print("\n🔍 Testing CORS Configuration...")
        
        try:
            response = requests.options(f"{self.api_url}/auth/me")
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            has_cors = any(cors_headers.values())
            self.log_test("CORS Headers Present", has_cors, f"Headers: {cors_headers}")
            
        except Exception as e:
            self.log_test("CORS Headers Test", False, f"Error: {str(e)}")

    def test_api_structure(self):
        """Test API endpoint structure and responses"""
        print("\n🔍 Testing API Structure...")
        
        # Test invalid endpoints
        self.run_test(
            "Invalid Endpoint",
            "GET",
            "invalid/endpoint",
            404
        )
        
        # Test method not allowed
        self.run_test(
            "Method Not Allowed",
            "DELETE",
            "auth/me",
            405
        )

    def generate_report(self):
        """Generate test report"""
        print(f"\n📊 Test Results Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": round((self.tests_passed/self.tests_run*100), 1),
            "test_details": self.test_results
        }

def main():
    print("🚀 Starting Attendance Management System API Tests")
    print("=" * 60)
    
    tester = AttendanceAPITester()
    
    # Run all tests
    tester.test_health_check()
    tester.test_auth_endpoints()
    tester.test_user_management_endpoints()
    tester.test_class_management_endpoints()
    tester.test_attendance_endpoints()
    tester.test_dashboard_endpoints()
    tester.test_cors_headers()
    tester.test_api_structure()
    
    # Generate report
    report = tester.generate_report()
    
    print("\n" + "=" * 60)
    print("🏁 Backend API Testing Complete")
    
    # Return appropriate exit code
    return 0 if report["success_rate"] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())