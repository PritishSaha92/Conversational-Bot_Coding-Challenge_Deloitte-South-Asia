from django.shortcuts import render

def chat_room(request, room_name):
    return render(request, 'chat_room.html', {
        'room_name': room_name
    })

def hr_metrics_upload(request):
    """Render the HR metrics upload form."""
    return render(request, 'upload_hr_metrics.html') 