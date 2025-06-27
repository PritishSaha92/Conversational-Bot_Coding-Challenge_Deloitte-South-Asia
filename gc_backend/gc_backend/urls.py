from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from . import views
from django.conf import settings
from django.conf.urls.static import static
from gc_backend.csv_processor.views import  process_hr_metrics, merge_hr_files,merge_hr_csv,run_anomaly_detection


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    path('employee/', include('employee.urls')),
    path('chat/<str:room_name>/', views.chat_room, name='chat_room'),
    path('employee/', include('datasets.urls')),
    path('api/process-hr-metrics/', process_hr_metrics, name='process_hr_metrics'),
    path('api/merge-hr-files/', merge_hr_files, name='merge_hr_files'),
     path('run-merge/', merge_hr_csv, name='run_data_merge'),
      path("detect-anomalies/",run_anomaly_detection, name="detect_anomalies"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
