import argparse
import asyncio
import os
import random
import json
from dotenv import load_dotenv
from livekit import api

load_dotenv(".env")

async def main():
    parser = argparse.ArgumentParser(description="Make an outbound call via LiveKit Agent.")
    parser.add_argument("--to", required=True, help="The phone number to call (e.g., +91...)")
    parser.add_argument("--first-line", default="", help="Custom opening line for this call")
    parser.add_argument("--instructions", default="", help="Custom agent instructions for this call")
    args = parser.parse_args()

    phone_number = args.to.strip()
    if not phone_number.startswith("+"):
        print("Error: Phone number must start with '+' and country code.")
        return

    url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not (url and api_key and api_secret):
        print("Error: LiveKit credentials missing in .env")
        return

    lk_api = api.LiveKitAPI(url=url, api_key=api_key, api_secret=api_secret)

    room_name = f"outbound-{phone_number.replace('+', '')}-{random.randint(1000, 9999)}"

    print(f"Initiating outbound call to {phone_number}...")
    print(f"Session Room: {room_name}")

    try:
        metadata = {
            "phone_number": phone_number,
            "is_outbound": True,
        }
        if args.first_line:
            metadata["custom_first_line"] = args.first_line
        if args.instructions:
            metadata["custom_instructions"] = args.instructions

        dispatch_request = api.CreateAgentDispatchRequest(
            agent_name="outbound-caller",
            room=room_name,
            metadata=json.dumps(metadata)
        )

        dispatch = await lk_api.agent_dispatch.create_dispatch(dispatch_request)

        print(f"\nCall dispatched successfully.")
        print(f"Dispatch ID: {dispatch.id}")
        print("-" * 40)
        print("The agent is joining the room and will dial the number via SIP.")
        print("Check your agent terminal for logs.")

    except Exception as e:
        print(f"\nError dispatching call: {e}")

    finally:
        await lk_api.aclose()

if __name__ == "__main__":
    asyncio.run(main())
