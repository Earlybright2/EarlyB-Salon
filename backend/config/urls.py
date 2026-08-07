"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path


def api_index(request):
    rows = []
    for prefix, module in [
        ("api/auth/", "apps.users.urls"),
        ("api/shop/", "apps.shop.urls"),
        ("api/admin/", "apps.dashboard.urls"),
    ]:
        for url in __import__(module, fromlist=["urlpatterns"]).urlpatterns:
            pattern = str(url.pattern)
            rows.append(f"<a href='/{prefix}{pattern}'>{prefix}{pattern}</a>")
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Early Bright Salon Backend API</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                max-width: 720px;
                margin: 0 auto;
                padding: 48px 24px;
                background: #faf7f2;
                color: #2b2b2b;
            }}
            h1 {{
                font-size: 28px;
                margin: 0 0 8px;
                color: #1a1a1a;
            }}
            .tagline {{
                font-size: 16px;
                color: #666;
                margin-bottom: 32px;
            }}
            ul {{ list-style: none; padding: 0; }}
            li {{
                margin: 0 0 12px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,.08);
            }}
            a {{
                display: block;
                padding: 14px 18px;
                text-decoration: none;
                color: #7a4a2b;
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 14px;
                border-radius: 8px;
            }}
            a:hover {{ background: #f4ece2; }}
            .section {{
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: .08em;
                color: #999;
                margin: 28px 0 10px;
            }}
        </style>
    </head>
    <body>
        <h1>Early Bright Salon Backend API</h1>
        <p class="tagline">Welcome to Early Bright Salon's Backend API</p>
        {"".join(rows)}
    </body>
    </html>
    """
    return HttpResponse(html)


urlpatterns = [
    path("", api_index, name="api-index"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/shop/", include("apps.shop.urls")),
    path("api/admin/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
