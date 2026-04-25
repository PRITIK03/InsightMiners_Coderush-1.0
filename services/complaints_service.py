from flask import jsonify
import sqlite3
from datetime import datetime

def init_complaints_db():
    conn = sqlite3.connect('complaints.db')
    c = conn.cursor()
    
    # Create complaints table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            complaint_type TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            pollution_level REAL,
            status TEXT DEFAULT 'pending',
            is_anonymous BOOLEAN DEFAULT 0,
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def submit_complaint(data):
    try:
        conn = sqlite3.connect('complaints.db')
        c = conn.cursor()
        
        # Insert complaint data
        c.execute('''
            INSERT INTO complaints (
                name, email, phone, complaint_type, description,
                location, pollution_level, is_anonymous, image_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('email'),
            data.get('phone'),
            data['complaintType'],
            data['description'],
            data['location'],
            data['pollutionLevel'],
            data['isAnonymous'],
            data.get('imagePath')
        ))
        
        complaint_id = c.lastrowid
        conn.commit()
        
        # Fetch the inserted complaint
        c.execute('SELECT * FROM complaints WHERE id = ?', (complaint_id,))
        complaint = c.fetchone()
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Complaint submitted successfully',
            'complaint_id': complaint_id,
            'complaint': format_complaint(complaint)
        }), 201
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def get_complaints(filters=None):
    try:
        conn = sqlite3.connect('complaints.db')
        c = conn.cursor()
        
        query = 'SELECT * FROM complaints'
        params = []
        
        if filters:
            conditions = []
            if 'status' in filters:
                conditions.append('status = ?')
                params.append(filters['status'])
            if 'type' in filters:
                conditions.append('complaint_type = ?')
                params.append(filters['type'])
            if 'location' in filters:
                conditions.append('location LIKE ?')
                params.append(f'%{filters["location"]}%')
            
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
        
        query += ' ORDER BY created_at DESC'
        
        c.execute(query, params)
        complaints = c.fetchall()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'complaints': [format_complaint(c) for c in complaints]
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def update_complaint_status(complaint_id, status):
    try:
        conn = sqlite3.connect('complaints.db')
        c = conn.cursor()
        
        if status.lower() == 'resolved':
            c.execute('''
                UPDATE complaints 
                SET status = ?, resolved_at = ? 
                WHERE id = ?
            ''', (status, datetime.now(), complaint_id))
        else:
            c.execute('''
                UPDATE complaints 
                SET status = ?
                WHERE id = ?
            ''', (status, complaint_id))
        
        conn.commit()
        
        # Fetch updated complaint
        c.execute('SELECT * FROM complaints WHERE id = ?', (complaint_id,))
        complaint = c.fetchone()
        
        conn.close()
        
        if complaint:
            return jsonify({
                'status': 'success',
                'message': 'Complaint status updated successfully',
                'complaint': format_complaint(complaint)
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Complaint not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def format_complaint(complaint_tuple):
    """Convert a complaint tuple to a dictionary with named fields"""
    return {
        'id': complaint_tuple[0],
        'name': complaint_tuple[1] if not complaint_tuple[8] else 'Anonymous',
        'email': complaint_tuple[2] if not complaint_tuple[8] else None,
        'phone': complaint_tuple[3] if not complaint_tuple[8] else None,
        'complaintType': complaint_tuple[4],
        'description': complaint_tuple[5],
        'location': complaint_tuple[6],
        'pollutionLevel': complaint_tuple[7],
        'status': complaint_tuple[8],
        'isAnonymous': bool(complaint_tuple[9]),
        'imagePath': complaint_tuple[10],
        'createdAt': complaint_tuple[11],
        'resolvedAt': complaint_tuple[12]
    }
