import requests
import sys
import json
from datetime import datetime, timedelta

class ERendezvuAPITester:
    def __init__(self, base_url="https://salonslot-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.business_data = None
        self.service_data = None
        self.staff_data = None
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
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            details = f"Status: {response.status_code}, Expected: {expected_status}"
            if not success:
                details += f", Response: {response_data}"

            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            return True
        return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not self.user_data:
            return False
            
        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_business(self):
        """Test business creation"""
        timestamp = datetime.now().strftime('%H%M%S')
        business_data = {
            "name": f"Test Salon {timestamp}",
            "slug": f"test-salon-{timestamp}",
            "description": "A test salon for automated testing",
            "phone": "+1-555-123-4567",
            "address": "123 Test Street, Test City"
        }
        
        success, response = self.run_test(
            "Create Business",
            "POST",
            "businesses",
            200,
            data=business_data
        )
        
        if success:
            self.business_data = response
            return True
        return False

    def test_get_business_by_slug(self):
        """Test getting business by slug"""
        if not self.business_data:
            return False
            
        success, response = self.run_test(
            "Get Business by Slug",
            "GET",
            f"businesses/{self.business_data['slug']}",
            200
        )
        return success

    def test_get_all_businesses(self):
        """Test getting all businesses"""
        success, response = self.run_test(
            "Get All Businesses",
            "GET",
            "businesses",
            200
        )
        return success

    def test_create_service(self):
        """Test service creation"""
        if not self.business_data:
            return False
            
        service_data = {
            "name": "Test Haircut",
            "description": "Professional haircut service",
            "duration": 30,
            "price": 25.00
        }
        
        success, response = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        
        if success:
            self.service_data = response
            return True
        return False

    def test_get_services(self):
        """Test getting services for business"""
        if not self.business_data:
            return False
            
        success, response = self.run_test(
            "Get Services",
            "GET",
            f"services/{self.business_data['id']}",
            200
        )
        return success

    def test_create_staff(self):
        """Test staff creation"""
        if not self.business_data:
            return False
            
        staff_data = {
            "name": "Test Stylist",
            "phone": "+1-555-987-6543",
            "email": "stylist@test.com",
            "services": [],
            "working_days": [1, 2, 3, 4, 5]
        }
        
        success, response = self.run_test(
            "Create Staff",
            "POST",
            "staff",
            200,
            data=staff_data
        )
        
        if success:
            self.staff_data = response
            return True
        return False

    def test_get_staff(self):
        """Test getting staff for business"""
        if not self.business_data:
            return False
            
        success, response = self.run_test(
            "Get Staff",
            "GET",
            f"staff/{self.business_data['id']}",
            200
        )
        return success

    def test_check_availability(self):
        """Test appointment availability check"""
        if not self.business_data or not self.staff_data:
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Check Availability",
            "GET",
            f"appointments/availability?business_id={self.business_data['id']}&staff_id={self.staff_data['id']}&appointment_date={tomorrow}&time_slot=10:00",
            200
        )
        return success

    def test_create_appointment(self):
        """Test appointment creation"""
        if not self.business_data or not self.service_data:
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "customer_name": "Test Customer",
            "customer_phone": "+1-555-111-2222",
            "service_id": self.service_data['id'],
            "staff_id": self.staff_data['id'] if self.staff_data else None,
            "appointment_date": tomorrow,
            "time_slot": "10:00",
            "notes": "Test appointment"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            f"appointments?business_id={self.business_data['id']}",
            200,
            data=appointment_data
        )
        
        if success:
            self.appointment_data = response
            return True
        return False

    def test_get_appointments(self):
        """Test getting appointments for business"""
        if not self.business_data:
            return False
            
        success, response = self.run_test(
            "Get Appointments",
            "GET",
            f"appointments/{self.business_data['id']}",
            200
        )
        return success

    def test_update_appointment_status(self):
        """Test updating appointment status"""
        if not hasattr(self, 'appointment_data') or not self.appointment_data:
            return False
            
        success, response = self.run_test(
            "Update Appointment Status",
            "PATCH",
            f"appointments/{self.appointment_data['id']}/status?status=completed",
            200
        )
        return success

    def test_double_booking_prevention(self):
        """Test double booking prevention"""
        if not self.business_data or not self.service_data or not self.staff_data:
            return False
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        appointment_data = {
            "customer_name": "Another Customer",
            "customer_phone": "+1-555-333-4444",
            "service_id": self.service_data['id'],
            "staff_id": self.staff_data['id'],
            "appointment_date": tomorrow,
            "time_slot": "10:00",  # Same time as previous appointment
            "notes": "Should fail due to double booking"
        }
        
        success, response = self.run_test(
            "Double Booking Prevention",
            "POST",
            f"appointments?business_id={self.business_data['id']}",
            400,  # Should fail with 400
            data=appointment_data
        )
        return success

    def test_delete_service(self):
        """Test service deletion"""
        if not self.service_data:
            return False
            
        success, response = self.run_test(
            "Delete Service",
            "DELETE",
            f"services/{self.service_data['id']}",
            200
        )
        return success

    def test_delete_staff(self):
        """Test staff deletion"""
        if not self.staff_data:
            return False
            
        success, response = self.run_test(
            "Delete Staff",
            "DELETE",
            f"staff/{self.staff_data['id']}",
            200
        )
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting E-Randevu API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False

        self.test_get_current_user()

        # Business management tests
        if not self.test_create_business():
            print("❌ Business creation failed, stopping tests")
            return False

        self.test_get_business_by_slug()
        self.test_get_all_businesses()

        # Service management tests
        if not self.test_create_service():
            print("❌ Service creation failed, continuing with limited tests")
        else:
            self.test_get_services()

        # Staff management tests
        if not self.test_create_staff():
            print("❌ Staff creation failed, continuing with limited tests")
        else:
            self.test_get_staff()

        # Appointment tests
        self.test_check_availability()
        
        if self.test_create_appointment():
            self.test_get_appointments()
            self.test_update_appointment_status()
            self.test_double_booking_prevention()

        # Cleanup tests
        if self.service_data:
            self.test_delete_service()
        if self.staff_data:
            self.test_delete_staff()

        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = ERendezvuAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())