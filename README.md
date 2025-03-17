import hashlib

user_database = {}

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def register_user():
    username = input("Enter your username: ")
    if username in user_database:
        print("Username already exists. Please try logging in or use a different username.")
        return
    password = input("Enter your password: ")
    user_database[username] = hash_password(password)
    print("Registration successful! You can now log in.")

def login_user():
    username = input("Enter your username: ")
    if username not in user_database:
        print("Username not found. Please register first.")
        return
    password = input("Enter your password: ")
    if user_database[username] == hash_password(password):
        print(f"Welcome back, {username}! You have successfully logged in.")
    else:
        print("Incorrect password. Please try again.")

def main():
    while True:
        print("\n--- BUConnect System ---")
        print("1. Register")
        print("2. Log In")
        print("3. Exit")
        choice = input("Choose an option (1/2/3): ")
        if choice == "1":
            register_user()
        elif choice == "2":
            login_user()
        elif choice == "3":
            print("Exiting the system. Goodbye!")
            break
        else:
            print("Invalid choice. Please select again.")

main()
